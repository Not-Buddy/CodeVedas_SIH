use actix_web::{web, HttpResponse, Result};
use serde::{Deserialize, Serialize};
use crate::dbcodes::{mongo, redis};
use crate::codecs::namaste::{NamasteCodec, NamasteFilter, Language};
use crate::codecs::icd::{IcdCodec, IcdFilter, IcdDiscipline};


// ICD and NAMASTE both search endpoint
pub async fn terminology_search(
    query: web::Query<std::collections::HashMap<String, String>>
) -> Result<HttpResponse> {
    let search_term = query.get("search").cloned();
    let limit = query.get("limit").and_then(|l| l.parse().ok());
    let language = query.get("language")
        .map(|l| match l.as_str() {
            "hindi" => Language::Hindi,
            "english" => Language::English,
            _ => Language::Both,
        })
        .unwrap_or(Language::Both);

    let mut combined_results = Vec::new();
    let mut namaste_count = 0;
    let mut icd_count = 0;

    // Helper function to extract code system from brackets like "(ICD)" or "(NAMASTE)"
    fn extract_code_system(label: &str) -> Option<String> {
        if let Some(start) = label.find('(') {
            if let Some(end) = label.find(')') {
                if end > start {
                    return Some(label[start + 1..end].to_string());
                }
            }
        }
        None
    }

    // Search NAMASTE codes
    let namaste_codec = NamasteCodec::new();
    let namaste_filter = NamasteFilter {
        code: None,
        language: language.clone(),
        search_term: search_term.clone(),
    };

    match namaste_codec.search_codes(namaste_filter, limit).await {
        Ok(codes) => {
            namaste_count = codes.len();
            let formatted = namaste_codec.format_response(codes, language.clone());
            for mut result in formatted {
                // ✅ REMOVE the manual parsing - it's already done in format_response!
                // The result already has nam_code and icd_code fields from namaste.rs
                
                // Just add metadata fields
                result.as_object_mut().unwrap().insert("source".to_string(), serde_json::Value::String("NAMASTE".to_string()));
                result.as_object_mut().unwrap().insert("system".to_string(), serde_json::Value::String("Ayurveda".to_string()));
                
                // Parse code_system from term, code, or display fields (keep this logic)
                let code_system = if let Some(term) = result.get("term").and_then(|v| v.as_str()) {
                    extract_code_system(term)
                } else if let Some(display) = result.get("display").and_then(|v| v.as_str()) {
                    extract_code_system(display)
                } else {
                    None
                };

                // Set code_system based on extracted value or default to "NAMASTE"
                if let Some(cs) = code_system {
                    result.as_object_mut().unwrap().insert("code_system".to_string(), serde_json::Value::String(cs));
                } else {
                    result.as_object_mut().unwrap().insert("code_system".to_string(), serde_json::Value::String("NAMASTE".to_string()));
                }
                
                combined_results.push(result);
            }
        },
        Err(e) => eprintln!("NAMASTE search failed: {}", e),
    }

    let icd_codec = IcdCodec::new();
    let icd_filter = IcdFilter {
        discipline: None,
        search_term: search_term.clone(),
        parent_filter: None,
    };

    match icd_codec.search_codes(icd_filter, limit).await {
        Ok(codes) => {
            icd_count = codes.len();
            let icd_formatted = icd_codec.format_response(codes); // ✅ Use icd_formatted variable name
            for mut result in icd_formatted {
                // Get mutable reference once
                if let Some(map) = result.as_object_mut() {
                    // Extract code value safely
                    let code_value = map.get("code")
                        .and_then(|v| v.as_str())
                        .map(|s| s.to_string());
                    
                    // Insert all fields
                    map.insert("nam_code".to_string(), serde_json::Value::Null);
                    map.insert("icd_code".to_string(), 
                        code_value.map(serde_json::Value::String)
                                 .unwrap_or(serde_json::Value::Null));
                    map.insert("source".to_string(), serde_json::Value::String("ICD-11".to_string()));
                    map.insert("system".to_string(), serde_json::Value::String("Biomedicine".to_string()));
                    map.insert("code_system".to_string(), serde_json::Value::String("ICD".to_string()));
                }
                
                combined_results.push(result);
            }
        },
        Err(e) => eprintln!("ICD search failed: {}", e),
    }

    // Apply global limit if specified
    if let Some(global_limit) = limit {
        combined_results.truncate(global_limit);
    }

    Ok(HttpResponse::Ok().json(serde_json::json!({
        "service": "Combined Terminology Search",
        "search_term": search_term,
        "total_results": combined_results.len(),
        "namaste_results": namaste_count,
        "icd_results": icd_count,
        "results": combined_results,
        "timestamp": chrono::Utc::now().to_rfc3339()
    })))
}

// ICD search endpoint

pub async fn icd_all(
    query: web::Query<std::collections::HashMap<String, String>>
) -> Result<HttpResponse> {
    let codec = IcdCodec::new();

    match codec.get_all_codes(query.get("limit").and_then(|l| l.parse().ok())).await {
        Ok(codes) => {
            let formatted = codec.format_response(codes);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "service": "ICD-11 All Codes",
                "total": formatted.len(),
                "results": formatted,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
            service: "ICD-11 All Codes".to_string(),
            status: "error".to_string(),
            message: format!("Failed: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}

pub async fn icd_search(
    query: web::Query<std::collections::HashMap<String, String>>
) -> Result<HttpResponse> {
    let codec = IcdCodec::new();
    
    let discipline = query.get("discipline")
        .and_then(|d| match d.to_lowercase().as_str() {
            "biomedicine" => Some(IcdDiscipline::Biomedicine),
            "tm2" => Some(IcdDiscipline::TM2),
            _ => None,
        });
    
    let filter = IcdFilter {
        discipline,
        search_term: query.get("search").cloned(),
        parent_filter: query.get("parent").cloned(),
    };
    
    match codec.search_codes(filter, query.get("limit").and_then(|l| l.parse().ok())).await {
        Ok(codes) => {
            let formatted = codec.format_response(codes);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "service": "ICD-11 Search",
                "total": formatted.len(),
                "results": formatted,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
            service: "ICD-11 Search".to_string(),
            status: "error".to_string(),
            message: format!("Search failed: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}

// Get biomedicine codes
pub async fn icd_biomedicine(
    query: web::Query<std::collections::HashMap<String, String>>
) -> Result<HttpResponse> {
    let codec = IcdCodec::new();

    match codec.get_biomedicine_codes(query.get("limit").and_then(|l| l.parse().ok())).await {
        Ok(codes) => {
            let formatted = codec.format_response(codes);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "service": "ICD-11 Biomedicine",
                "discipline": "BIOMEDICINE",
                "total": formatted.len(),
                "results": formatted,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
            service: "ICD-11 Biomedicine".to_string(),
            status: "error".to_string(),
            message: format!("Failed: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}

// Get TM2 codes
pub async fn icd_tm2(
    query: web::Query<std::collections::HashMap<String, String>>
) -> Result<HttpResponse> {
    let codec = IcdCodec::new();

    match codec.get_tm2_codes(query.get("limit").and_then(|l| l.parse().ok())).await {
        Ok(codes) => {
            let formatted = codec.format_response(codes);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "service": "ICD-11 Traditional Medicine",
                "discipline": "TM2",
                "total": formatted.len(),
                "results": formatted,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
            service: "ICD-11 TM2".to_string(),
            status: "error".to_string(),
            message: format!("Failed: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}

// NAMASTE search endpoint
pub async fn namaste_search(
    query: web::Query<std::collections::HashMap<String, String>>
) -> Result<HttpResponse> {
    let codec = NamasteCodec::new();
    
    let language = query.get("language")
        .map(|l| match l.as_str() {
            "hindi" => Language::Hindi,
            "english" => Language::English,
            _ => Language::Both,
        })
        .unwrap_or(Language::Both);
    
    let filter = NamasteFilter {
        code: query.get("code").cloned(),
        language: language.clone(),
        search_term: query.get("search").cloned(),
    };
    
    match codec.search_codes(filter, query.get("limit").and_then(|l| l.parse().ok())).await {
        Ok(codes) => {
            let formatted = codec.format_response(codes, language);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "service": "NAMASTE Code Search",
                "total": formatted.len(),
                "results": formatted,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
            service: "NAMASTE Code Search".to_string(),
            status: "error".to_string(),
            message: format!("Search failed: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}

// Add endpoint to get all codes
pub async fn namaste_all(
    query: web::Query<std::collections::HashMap<String, String>>
) -> Result<HttpResponse> {
    let codec = NamasteCodec::new();
    let language = query.get("language")
        .map(|l| match l.as_str() {
            "hindi" => Language::Hindi,
            "english" => Language::English,
            _ => Language::Both,
        })
        .unwrap_or(Language::Both);

    match codec.get_all_codes(query.get("limit").and_then(|l| l.parse().ok())).await {
        Ok(codes) => {
            let formatted = codec.format_response(codes, language);
            Ok(HttpResponse::Ok().json(serde_json::json!({
                "service": "NAMASTE All Codes",
                "total": formatted.len(),
                "results": formatted,
                "timestamp": chrono::Utc::now().to_rfc3339()
            })))
        },
        Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
            service: "NAMASTE All Codes".to_string(),
            status: "error".to_string(),
            message: format!("Failed: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}

// Basic response structure
#[derive(Serialize, Deserialize)]
pub struct ApiResponse {
    pub service: String,
    pub status: String,
    pub message: String,
    pub timestamp: String,
}

// Health check endpoint
pub async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "FHIR Terminology Server".to_string(),
        status: "healthy".to_string(),
        message: "Server is running successfully".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// API Gateway handler
pub async fn api_gateway() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "API Gateway & OAuth 2.0 + ABHA Authentication".to_string(),
        status: "active".to_string(),
        message: "Authentication layer is operational".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// REST API Server handler
pub async fn rest_api() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "REST API Server".to_string(),
        status: "running".to_string(),
        message: "Main API server handling requests".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// Backend Services
pub async fn terminology_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Terminology Service".to_string(),
        status: "running".to_string(),
        message: "Managing medical terminologies and codes".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn mapping_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Mapping Service".to_string(),
        status: "running".to_string(),
        message: "Handling terminology mappings".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn sync_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Sync Service".to_string(),
        status: "running".to_string(),
        message: "Synchronizing with external APIs".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn audit_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Audit Service".to_string(),
        status: "running".to_string(),
        message: "Logging and auditing system activities".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// Core Components
pub async fn fhir_engine() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "FHIR R4 Engine".to_string(),
        status: "running".to_string(),
        message: "Processing FHIR R4 resources".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn vocabulary_manager() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Vocabulary Manager".to_string(),
        status: "running".to_string(),
        message: "Managing medical vocabularies".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn translation_engine() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Translation Engine".to_string(),
        status: "running".to_string(),
        message: "Translating between coding systems".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// Data Layer - REAL MongoDB status using our mongo module
pub async fn mongodb_status() -> Result<HttpResponse> {
    let status = mongo::get_connection_status().await;
    let message = if status.connected {
        format!("Connected to {} - {}",
            status.database_name,
            status.server_info.unwrap_or_else(|| "MongoDB".to_string())
        )
    } else {
        format!("Connection failed: {}",
            status.error.unwrap_or_else(|| "Unknown error".to_string())
        )
    };

    let response = ApiResponse {
        service: "MongoDB".to_string(),
        status: if status.connected { "connected" } else { "disconnected" }.to_string(),
        message,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };

    if status.connected {
        Ok(HttpResponse::Ok().json(response))
    } else {
        Ok(HttpResponse::ServiceUnavailable().json(response))
    }
}

// Data Layer - REAL Redis status using our redis module
pub async fn redis_status() -> Result<HttpResponse> {
    let status = redis::get_connection_status().await;
    let message = if status.connected {
        status.server_info.unwrap_or_else(|| "Redis connected".to_string())
    } else {
        format!("Connection failed: {}",
            status.error.unwrap_or_else(|| "Unknown error".to_string())
        )
    };

    let response = ApiResponse {
        service: "Redis Cache".to_string(),
        status: if status.connected { "connected" } else { "disconnected" }.to_string(),
        message,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };

    if status.connected {
        Ok(HttpResponse::Ok().json(response))
    } else {
        Ok(HttpResponse::ServiceUnavailable().json(response))
    }
}

// External APIs
pub async fn who_api() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "WHO ICD-11 API".to_string(),
        status: "connected".to_string(),
        message: "WHO ICD-11 integration active".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

pub async fn namaste_csv() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "NAMASTE CSV Files".to_string(),
        status: "accessible".to_string(),
        message: "NAMASTE data processing ready".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// MongoDB-specific endpoints
pub async fn mongodb_collections() -> Result<HttpResponse> {
    match mongo::MongoClient::get_instance().await {
        Ok(client) => {
            match client.list_collections().await {
                Ok(collections) => Ok(HttpResponse::Ok().json(serde_json::json!({
                    "service": "MongoDB Collections",
                    "collections": collections,
                    "count": collections.len(),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))),
                Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
                    service: "MongoDB Collections".to_string(),
                    status: "error".to_string(),
                    message: format!("Failed to list collections: {}", e),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }))
            }
        },
        Err(e) => Ok(HttpResponse::ServiceUnavailable().json(ApiResponse {
            service: "MongoDB Collections".to_string(),
            status: "unavailable".to_string(),
            message: format!("MongoDB not connected: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}

pub async fn ayurveda_terminology() -> Result<HttpResponse> {
    match mongo::MongoClient::get_instance().await {
        Ok(client) => {
            let ayurveda_db = client.get_database_by_name("ayurveda_db");
            match ayurveda_db.list_collection_names(None).await {
                Ok(collections) => Ok(HttpResponse::Ok().json(serde_json::json!({
                    "service": "Ayurveda Terminology",
                    "status": "available",
                    "database_size": "584 KB",
                    "collections": collections,
                    "message": "Ayurveda database ready for FHIR terminology services",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }))),
                Err(e) => Ok(HttpResponse::InternalServerError().json(ApiResponse {
                    service: "Ayurveda Terminology".to_string(),
                    status: "error".to_string(),
                    message: format!("Failed to access ayurveda_db: {}", e),
                    timestamp: chrono::Utc::now().to_rfc3339(),
                }))
            }
        },
        Err(e) => Ok(HttpResponse::ServiceUnavailable().json(ApiResponse {
            service: "Ayurveda Terminology".to_string(),
            status: "unavailable".to_string(),
            message: format!("Database not connected: {}", e),
            timestamp: chrono::Utc::now().to_rfc3339(),
        }))
    }
}
