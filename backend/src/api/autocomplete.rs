use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use crate::dbcodes::redis::{RedisClient, AutocompleteSuggestion, BulkSuggestion};
use crate::codecs::icd::IcdCodec;
use crate::codecs::namaste::NamasteCodec;
use serde_json::json;

#[derive(Serialize, Deserialize)]
pub struct AutocompleteRequest {
    pub query: String,
    pub category: Option<String>, // "icd", "namaste", or "all"
    pub limit: Option<usize>,
}

#[derive(Serialize, Deserialize)]
pub struct AutocompleteResponse {
    pub query: String,
    pub suggestions: Vec<FormattedSuggestion>,
    pub total: usize,
    pub category: String,
    pub timestamp: String,
}

#[derive(Serialize, Deserialize)]
pub struct FormattedSuggestion {
    pub id: String,
    pub code: String,
    pub title: String,
    pub definition: Option<String>,
    pub source: String,
    pub system: String,
    pub relevance_score: f64,
}

// Main autocomplete endpoint
// Main autocomplete endpoint
pub async fn autocomplete_suggestions(
    query: web::Query<AutocompleteRequest>
) -> Result<HttpResponse> {
    let search_query = query.query.trim();
    let category = query.category.as_deref().unwrap_or("all");
    let limit = query.limit.unwrap_or(3);

    if search_query.is_empty() {
        return Ok(HttpResponse::BadRequest().json(json!({
            "error": "Query parameter cannot be empty",
            "timestamp": chrono::Utc::now().to_rfc3339()
        })));
    }

    match RedisClient::get_instance().await {
        Ok(redis_manager) => {
            let redis_client = RedisClient { manager: redis_manager.clone() };
            
            let mut all_suggestions = Vec::new();
            
            match category {
                "icd" => {
                    let icd_suggestions = redis_client
                        .get_autocomplete_suggestions("icd", search_query, limit)
                        .await
                        .unwrap_or_default();
                    all_suggestions.extend(format_icd_suggestions(icd_suggestions));
                }
                "namaste" => {
                    let namaste_suggestions = redis_client
                        .get_autocomplete_suggestions("namaste", search_query, limit)
                        .await
                        .unwrap_or_default();
                    all_suggestions.extend(format_namaste_suggestions(namaste_suggestions));
                }
                _ => {
                    // Search both categories
                    let icd_suggestions = redis_client
                        .get_autocomplete_suggestions("icd", search_query, limit)
                        .await
                        .unwrap_or_default();
                    let namaste_suggestions = redis_client
                        .get_autocomplete_suggestions("namaste", search_query, limit)
                        .await
                        .unwrap_or_default();
                    
                    all_suggestions.extend(format_icd_suggestions(icd_suggestions));
                    all_suggestions.extend(format_namaste_suggestions(namaste_suggestions));
                }
            }
            
            // Sort by relevance score and limit results
            all_suggestions.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
            all_suggestions.truncate(limit);

            // FIX: Calculate total BEFORE moving all_suggestions
            let total = all_suggestions.len();

            Ok(HttpResponse::Ok().json(AutocompleteResponse {
                query: search_query.to_string(),
                suggestions: all_suggestions,  // ← Move happens here
                total,                         // ← Use the pre-calculated value
                category: category.to_string(),
                timestamp: chrono::Utc::now().to_rfc3339(),
            }))
        }
        Err(e) => {
            println!("Redis connection error: {}", e);
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": "Redis connection failed",
                "message": e.to_string(),
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        }
    }
}

// Initialize autocomplete data
pub async fn initialize_autocomplete_data() -> Result<HttpResponse> {
    match RedisClient::get_instance().await {
        Ok(redis_manager) => {
            let redis_client = RedisClient { manager: redis_manager.clone() };
            
            println!("🔄 Initializing autocomplete data...");
            
            // Load ICD data
            let icd_codec = IcdCodec::new();
            if let Ok(icd_codes) = icd_codec.get_all_codes(Some(1000)).await {
                let icd_suggestions: Vec<BulkSuggestion> = icd_codes
                    .into_iter()
                    .map(|code| BulkSuggestion {
                        category: "icd".to_string(),
                        text: format!("{} {}", code.code, code.title),
                        score: 1.0,
                        payload: Some(json!({
                            "id": code.id,
                            "code": code.code,
                            "title": code.title,
                            "definition": code.definition,
                            "source": "ICD-11",
                            "system": "Biomedicine"
                        }).to_string()),
                    })
                    .collect();
                
                if let Err(e) = redis_client.bulk_add_suggestions(icd_suggestions).await {
                    println!("Failed to add ICD suggestions: {}", e);
                }
            }
            
            // Load NAMASTE data
            let namaste_codec = NamasteCodec::new();
            if let Ok(namaste_codes) = namaste_codec.get_all_codes(Some(1000)).await {
                let namaste_suggestions: Vec<BulkSuggestion> = namaste_codes
                    .into_iter()
                    .map(|code| BulkSuggestion {
                        category: "namaste".to_string(),
                        text: format!("{} {}", code.namc_id, code.namc_term),
                        score: 1.0,
                        payload: Some(json!({
                            "id": code.namc_id,
                            "code": code.namc_id,
                            "title": code.namc_term,
                            "definition": code.namc_term,
                            "source": "NAMASTE",
                            "system": "Ayurveda"
                        }).to_string()),
                    })
                    .collect();
                
                if let Err(e) = redis_client.bulk_add_suggestions(namaste_suggestions).await {
                    println!("Failed to add NAMASTE suggestions: {}", e);
                }
            }
            
            println!("✅ Autocomplete data initialization completed");
            
            Ok(HttpResponse::Ok().json(json!({
                "status": "success",
                "message": "Autocomplete data initialized successfully",
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        }
        Err(e) => {
            Ok(HttpResponse::InternalServerError().json(json!({
                "error": "Redis connection failed",
                "message": e.to_string(),
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        }
    }
}

fn format_icd_suggestions(suggestions: Vec<AutocompleteSuggestion>) -> Vec<FormattedSuggestion> {
    suggestions
        .into_iter()
        .filter_map(|suggestion| {
            if let Some(payload_str) = suggestion.payload {
                if let Ok(payload) = serde_json::from_str::<serde_json::Value>(&payload_str) {
                    return Some(FormattedSuggestion {
                        id: payload.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        code: payload.get("code").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        title: payload.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        definition: payload.get("definition").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        source: "ICD-11".to_string(),
                        system: "Biomedicine".to_string(),
                        relevance_score: suggestion.score,
                    });
                }
            }
            None
        })
        .collect()
}

fn format_namaste_suggestions(suggestions: Vec<AutocompleteSuggestion>) -> Vec<FormattedSuggestion> {
    suggestions
        .into_iter()
        .filter_map(|suggestion| {
            if let Some(payload_str) = suggestion.payload {
                if let Ok(payload) = serde_json::from_str::<serde_json::Value>(&payload_str) {
                    return Some(FormattedSuggestion {
                        id: payload.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        code: payload.get("code").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        title: payload.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                        definition: payload.get("definition").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        source: "NAMASTE".to_string(),
                        system: "Ayurveda".to_string(),
                        relevance_score: suggestion.score,
                    });
                }
            }
            None
        })
        .collect()
}
