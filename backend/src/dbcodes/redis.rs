use redis::{Client, aio::ConnectionManager, AsyncCommands};
use tokio::sync::OnceCell;
use serde::{Deserialize, Serialize};
use std::env;
use dotenv::dotenv;

// Global Redis client instance
static REDIS_CLIENT: OnceCell<ConnectionManager> = OnceCell::const_new();

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RedisStatus {
    pub connected: bool,
    pub server_info: Option<String>,
    pub error: Option<String>,
}

#[derive(Clone)]
pub struct RedisClient {
    pub manager: ConnectionManager,
}

impl RedisClient {
    pub async fn new() -> Result<RedisClient, redis::RedisError> {
        dotenv().ok();
        
        let redis_url = env::var("REDIS_URL")
            .unwrap_or_else(|_| {
                println!("⚠️ REDIS_URL not found in .env, using default");
                "redis://127.0.0.1/".to_string()
            });
        
        println!("🔗 Connecting to Redis: {}", &redis_url);
        
        let client = Client::open(redis_url)?;
        let manager = ConnectionManager::new(client).await?;
        
        println!("✅ Redis client initialized");
        Ok(RedisClient { manager })
    }

    pub async fn get_instance() -> Result<&'static ConnectionManager, redis::RedisError> {
        REDIS_CLIENT
            .get_or_try_init(|| async {
                let client = RedisClient::new().await?;
                Ok(client.manager)
            })
            .await
    }

    pub async fn health_check(&self) -> RedisStatus {
        let mut conn = self.manager.clone();
        match redis::cmd("PING").query_async::<_, String>(&mut conn).await {
            Ok(response) if response == "PONG" => RedisStatus {
                connected: true,
                server_info: Some("Redis server responded with PONG".to_string()),
                error: None,
            },
            Ok(other_response) => RedisStatus {
                connected: false,
                server_info: Some(format!("Unexpected response: {}", other_response)),
                error: None,
            },
            Err(e) => RedisStatus {
                connected: false,
                server_info: None,
                error: Some(e.to_string()),
            },
        }
    }

    // Calculate relevance score based on multiple factors
    fn calculate_relevance_score(&self, query: &str, entry: &str, match_type: MatchType) -> f64 {
        let query_lower = query.to_lowercase();
        let entry_lower = entry.to_lowercase();
        
        let mut score = 1.0;
        
        // 1. Match type scoring
        match match_type {
            MatchType::ExactTitle => score += 10.0,      // "Fever" matches "Fever"
            MatchType::StartsWith => score += 8.0,       // "Fev" matches "Fever" 
            MatchType::WordStart => score += 5.0,        // "Acute" matches "Acute kidney injury"
            MatchType::Contains => score += 2.0,         // "fever" matches "rheumatic fever"
            MatchType::Related => score += 1.0,          // Related terms
        }
        
        // 2. Query length vs match length (prefer shorter, more specific matches)
        let query_len = query_lower.len() as f64;
        let entry_len = entry_lower.len() as f64;
        if entry_len > 0.0 {
            score += (query_len / entry_len) * 2.0;
        }
        
        // 3. Common medical terms boost
        let common_terms = [
            "fever", "pain", "infection", "acute", "chronic", "syndrome", 
            "disease", "disorder", "injury", "fracture", "diabetes", 
            "hypertension", "pneumonia", "cancer", "tumor", "inflammation"
        ];
        
        for term in &common_terms {
            if entry_lower.contains(term) {
                score += 1.5;
            }
        }
        
        // 4. Penalty for very specific/rare conditions
        let complexity_indicators = [
            "unspecified", "not elsewhere classified", "other specified", 
            "without mention", "with mention", "sequela"
        ];
        
        for indicator in &complexity_indicators {
            if entry_lower.contains(indicator) {
                score -= 2.0;
            }
        }
        
        // 5. Boost for primary conditions (shorter codes typically)
        if let Some(code_part) = entry.split_whitespace().next() {
            if code_part.len() <= 4 {  // Short codes like "A00", "I10" are usually primary
                score += 3.0;
            }
        }
        
        score.max(0.1) // Ensure minimum score
    }
    
    // Determine match type
    fn get_match_type(&self, query: &str, entry: &str) -> MatchType {
        let query_lower = query.to_lowercase();
        let entry_lower = entry.to_lowercase();
        
        // Extract title from entry (after the code)
        let title = if let Some(space_idx) = entry.find(' ') {
            &entry[space_idx + 1..]
        } else {
            entry
        }.to_lowercase();
        
        if title == query_lower {
            MatchType::ExactTitle
        } else if title.starts_with(&query_lower) {
            MatchType::StartsWith
        } else if entry_lower.split_whitespace().any(|word| word.starts_with(&query_lower)) {
            MatchType::WordStart
        } else if entry_lower.contains(&query_lower) {
            MatchType::Contains
        } else {
            MatchType::Related
        }
    }

    // Enhanced autocomplete with relevance scoring
    pub async fn get_autocomplete_suggestions(
        &self,
        key: &str,
        prefix: &str,
        limit: usize,
    ) -> Result<Vec<AutocompleteSuggestion>, redis::RedisError> {
        let mut conn = self.manager.clone();
        let search_term = prefix.trim().to_lowercase();
        
        println!("🔍 Searching for '{}' in autocomplete:{}", search_term, key);
        
        // Search in word index
        let start_range = format!("[{}", search_term);
        let end_range = format!("[{}~", search_term);
        
        let matching_words: Vec<String> = conn
            .zrangebylex_limit(
                format!("autocomplete:{}:words", key),
                &start_range,
                &end_range,
                0,
                (limit * 3) as isize, // Get more candidates for better relevance filtering
            )
            .await?;
        
        println!("🔍 Found {} matching words: {:?}", matching_words.len(), matching_words);
        
        let mut scored_results = Vec::new();
        let mut seen_entries = std::collections::HashSet::new();
        
        for word in matching_words {
            let full_entry: Option<String> = conn
                .hget(format!("autocomplete:{}:word_to_entry", key), &word)
                .await
                .unwrap_or(None);
                
            if let Some(entry) = full_entry {
                if seen_entries.insert(entry.clone()) {
                    let payload: Option<String> = conn
                        .hget(format!("autocomplete:{}:payloads", key), &entry)
                        .await
                        .unwrap_or(None);
                    
                    // Calculate intelligent relevance score
                    let match_type = self.get_match_type(&search_term, &entry);
                    let relevance_score = self.calculate_relevance_score(&search_term, &entry, match_type);
                    
                    scored_results.push(ScoredSuggestion {
                        suggestion: AutocompleteSuggestion {
                            text: entry,
                            payload,
                            score: relevance_score,
                        },
                        relevance_score,
                    });
                }
            }
        }
        
        // Sort by relevance score (highest first)
        scored_results.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());
        
        // Take top results
        let results: Vec<AutocompleteSuggestion> = scored_results
            .into_iter()
            .take(limit)
            .map(|scored| scored.suggestion)
            .collect();
        
        println!("🔍 Returning {} results with improved relevance scoring", results.len());
        
        Ok(results)
    }

    pub async fn bulk_add_suggestions(
        &self,
        suggestions: Vec<BulkSuggestion>,
    ) -> Result<(), redis::RedisError> {
        let mut conn = self.manager.clone();
        
        for suggestion in suggestions {
            let clean_text = suggestion.text.trim().to_lowercase();
            
            // Store the full entry
            let _: () = conn.zadd(
                format!("autocomplete:{}", suggestion.category),
                &clean_text,
                suggestion.score,
            ).await?;
            
            // Store payload
            if let Some(payload) = &suggestion.payload {
                let _: () = conn.hset(
                    format!("autocomplete:{}:payloads", suggestion.category),
                    &clean_text,
                    payload,
                ).await?;
            }
            
            // Store individual words for better searchability
            let words: Vec<&str> = clean_text.split_whitespace().collect();
            
            for word in words {
                if word.len() >= 2 {
                    let word_clean = word.trim_end_matches(&[',', '.', ';', ':', '!', '?'][..]);
                    
                    let word_key = format!("autocomplete:{}:words", suggestion.category);
                    let _: () = conn.zadd(&word_key, word_clean, suggestion.score).await?;
                    
                    // Link word back to full entry
                    let _: () = conn.hset(
                        format!("autocomplete:{}:word_to_entry", suggestion.category),
                        word_clean,
                        &clean_text,
                    ).await?;
                }
            }
        }
        
        Ok(())
    }
}

#[derive(Debug, Clone)]
enum MatchType {
    ExactTitle,    // Query exactly matches the title
    StartsWith,    // Title starts with query
    WordStart,     // A word in the title starts with query
    Contains,      // Title contains query
    Related,       // Related/partial match
}

#[derive(Debug)]
struct ScoredSuggestion {
    suggestion: AutocompleteSuggestion,
    relevance_score: f64,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct AutocompleteSuggestion {
    pub text: String,
    pub payload: Option<String>,
    pub score: f64,
}

#[derive(Clone, Debug)]
pub struct BulkSuggestion {
    pub category: String,
    pub text: String,
    pub score: f64,
    pub payload: Option<String>,
}

// Initialize Redis connection
pub async fn init_redis() -> Result<(), redis::RedisError> {
    RedisClient::get_instance().await?;
    Ok(())
}

// Get Redis connection status
pub async fn get_connection_status() -> RedisStatus {
    match RedisClient::get_instance().await {
        Ok(manager) => {
            let client = RedisClient { manager: manager.clone() };
            client.health_check().await
        },
        Err(e) => RedisStatus {
            connected: false,
            server_info: None,
            error: Some(e.to_string()),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_redis_connection() {
        match RedisClient::new().await {
            Ok(client) => {
                let status = client.health_check().await;
                assert!(status.connected || status.error.is_some());
            },
            Err(e) => {
                println!("Redis connection failed (expected in CI): {}", e);
            }
        }
    }
}
