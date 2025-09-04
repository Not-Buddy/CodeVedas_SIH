use serde::{Deserialize, Serialize};
use mongodb::bson::{doc, Document};
use std::collections::HashMap;
use crate::dbcodes::mongo;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NamasteCode {
    #[serde(rename = "field_1")]
    pub sr_no: i32,
    #[serde(rename = "field_1_1")]
    pub namc_id: i32,
    #[serde(rename = "AYU")]
    pub namc_code: String,
    #[serde(rename = "vyAdhi-viniScayaH")]
    pub namc_term: String,
    #[serde(rename = "vyādhi-viniścayaḥ")]
    pub namc_term_diacritical: String,
    #[serde(rename = "व्याधि-विनिश्चयः")]
    pub namc_term_devanagari: String,
    #[serde(rename = "Unnamed: 6")]
    pub short_definition: Option<String>,
    #[serde(rename = "Unnamed: 7")]
    pub long_definition: Option<String>,
    #[serde(rename = "Unnamed: 8")]
    pub ontology_branches: Option<String>,
}

#[derive(Debug, Clone)]
pub struct NamasteFilter {
    pub code: Option<String>,
    pub language: Language,
    pub search_term: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Language {
    English,
    Hindi,
    Both,
}

pub struct NamasteCodec;

impl NamasteCodec {
    pub fn new() -> Self {
        Self
    }

    pub async fn search_codes(
        &self,
        filter: NamasteFilter,
        limit: Option<usize>,
    ) -> Result<Vec<NamasteCode>, Box<dyn std::error::Error>> {
        println!("🔍 Searching NAMASTE codes with filter: {:?}", filter);

        let client = mongo::MongoClient::get_instance().await?;
        let ayurveda_db = client.get_database_by_name("ayurveda_db");
        let collection = ayurveda_db.collection::<NamasteCode>("namc_codes");

        // Build query based on actual field names
        let mut query = doc! {};

        if let Some(code) = &filter.code {
            query.insert("AYU", mongodb::bson::Regex {
                pattern: code.clone(),
                options: "i".to_string(),
            });
        }

        if let Some(search_term) = &filter.search_term {
            // Fix: Use Vec instead of array for $or query
            query.insert("$or", vec![
                doc! { "vyAdhi-viniScayaH": { "$regex": search_term, "$options": "i" } },
                doc! { "vyādhi-viniścayaḥ": { "$regex": search_term, "$options": "i" } },
                doc! { "व्याधि-विनिश्चयः": { "$regex": search_term, "$options": "i" } },
                doc! { "AYU": { "$regex": search_term, "$options": "i" } }
            ]);
        }

        println!("📊 MongoDB query: {:?}", query);

        let mut find_options = mongodb::options::FindOptions::default();
        if let Some(limit) = limit {
            find_options.limit = Some(limit as i64);
        }

        let mut cursor = collection.find(query, find_options).await?;
        let mut results = Vec::new();

        while cursor.advance().await? {
            let code = cursor.deserialize_current()?;
            results.push(code);
        }

        println!("✅ Found {} NAMASTE codes", results.len());
        Ok(results)
    }

    pub async fn get_all_codes(&self, limit: Option<usize>) -> Result<Vec<NamasteCode>, Box<dyn std::error::Error>> {
        let filter = NamasteFilter {
            code: None,
            language: Language::Both,
            search_term: None,
        };
        self.search_codes(filter, limit).await
    }

    pub fn format_response(&self, codes: Vec<NamasteCode>, language: Language) -> Vec<serde_json::Value> {
        codes.into_iter().map(|code| {
            let display_name = match language {
                Language::Hindi => code.namc_term_devanagari.clone(),
                Language::English => code.namc_term_diacritical.clone(),
                Language::Both => format!("{} / {}", code.namc_term_diacritical, code.namc_term_devanagari),
            };

            serde_json::json!({
                "sr_no": code.sr_no,
                "namc_id": code.namc_id,
                "code": code.namc_code,
                "term": code.namc_term,
                "display": display_name,
                "short_definition": code.short_definition,
                "long_definition": code.long_definition,
                "ontology_branches": code.ontology_branches
            })
        }).collect()
    }
}

// You also need to define these enums that were missing:
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum NamasteDiscipline {
    Ayurveda,
    // Add others as needed based on your data
}
