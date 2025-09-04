use actix_web::{web, App, HttpServer, HttpResponse, Result, middleware::Logger};
use serde::{Deserialize, Serialize};

// Import our MongoDB module from the crate root
use crate::dbcodes::{mongo, redis}; 

// Basic response structure
#[derive(Serialize, Deserialize)]
pub struct ApiResponse {
    pub service: String,
    pub status: String,
    pub message: String,
    pub timestamp: String,
}

// Health check endpoint
async fn health_check() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "FHIR Terminology Server".to_string(),
        status: "healthy".to_string(),
        message: "Server is running successfully".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// API Gateway handler
async fn api_gateway() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "API Gateway & OAuth 2.0 + ABHA Authentication".to_string(),
        status: "active".to_string(),
        message: "Authentication layer is operational".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// REST API Server handler
async fn rest_api() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "REST API Server".to_string(),
        status: "running".to_string(),
        message: "Main API server handling requests".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// Backend Services
async fn terminology_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Terminology Service".to_string(),
        status: "running".to_string(),
        message: "Managing medical terminologies and codes".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn mapping_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Mapping Service".to_string(),
        status: "running".to_string(),
        message: "Handling terminology mappings".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn sync_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Sync Service".to_string(),
        status: "running".to_string(),
        message: "Synchronizing with external APIs".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn audit_service() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Audit Service".to_string(),
        status: "running".to_string(),
        message: "Logging and auditing system activities".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// Core Components
async fn fhir_engine() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "FHIR R4 Engine".to_string(),
        status: "running".to_string(),
        message: "Processing FHIR R4 resources".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn vocabulary_manager() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Vocabulary Manager".to_string(),
        status: "running".to_string(),
        message: "Managing medical vocabularies".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn translation_engine() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "Translation Engine".to_string(),
        status: "running".to_string(),
        message: "Translating between coding systems".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// Data Layer - REAL MongoDB status using our mongo module
async fn mongodb_status() -> Result<HttpResponse> {
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
    
    // Fix: Create the response properly without trying to mutate HttpResponse
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
async fn redis_status() -> Result<HttpResponse> {
    let status = redis::get_connection_status().await;  // Fix: Use correct function name
    
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
async fn who_api() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "WHO ICD-11 API".to_string(),
        status: "connected".to_string(),
        message: "WHO ICD-11 integration active".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

async fn namaste_csv() -> Result<HttpResponse> {
    Ok(HttpResponse::Ok().json(ApiResponse {
        service: "NAMASTE CSV Files".to_string(),
        status: "accessible".to_string(),
        message: "NAMASTE data processing ready".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    }))
}

// MongoDB-specific endpoints
async fn mongodb_collections() -> Result<HttpResponse> {
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

// Configure all routes
fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Health check
        .route("/health", web::get().to(health_check))
        
        // API Gateway
        .route("/gateway", web::get().to(api_gateway))
        
        // Main API
        .route("/api", web::get().to(rest_api))
        
        // Backend Services
        .service(
            web::scope("/services")
                .route("/terminology", web::get().to(terminology_service))
                .route("/mapping", web::get().to(mapping_service))
                .route("/sync", web::get().to(sync_service))
                .route("/audit", web::get().to(audit_service))
        )
        
        // Core Components
        .service(
            web::scope("/core")
                .route("/fhir", web::get().to(fhir_engine))
                .route("/vocabulary", web::get().to(vocabulary_manager))
                .route("/translation", web::get().to(translation_engine))
        )
        
        // Data Layer
        .service(
            web::scope("/data")
                .route("/mongodb", web::get().to(mongodb_status))
                .route("/mongodb/collections", web::get().to(mongodb_collections))
                .route("/redis", web::get().to(redis_status))
        )
        
        // External APIs
        .service(
            web::scope("/external")
                .route("/who-icd11", web::get().to(who_api))
                .route("/namaste-csv", web::get().to(namaste_csv))
        );
}

// Create the application - Fix the deprecated warning
pub fn create_app() -> App<
    impl actix_web::dev::ServiceFactory<
        actix_web::dev::ServiceRequest,
        Response = actix_web::dev::ServiceResponse<impl actix_web::body::MessageBody>,
        Error = actix_web::Error,
        Config = (),
        InitError = (),
    >
> {
    App::new()
        .configure(configure_routes)
        .wrap(Logger::default())
        .wrap(
            actix_web::middleware::DefaultHeaders::new()
                .add(("Content-Type", "application/json"))  // Fixed deprecated method
        )
}

// Start the server
pub async fn start_server() -> std::io::Result<()> {
    // Initialize logging
    env_logger::init();
    
    println!("🚀 Starting FHIR Terminology Server...");
    
    // Initialize MongoDB connection
    match mongo::init_mongodb().await {
        Ok(_) => println!("✅ MongoDB connection initialized"),
        Err(e) => println!("⚠️  MongoDB connection failed: {} (server will still start)", e),
    }
    
    // Initialize Redis connection
    match redis::init_redis().await {
        Ok(_) => println!("✅ Redis connection initialized"),
        Err(e) => println!("⚠️  Redis connection failed: {} (server will still start)", e),
    }
    
    println!("📊 Server running on http://127.0.0.1:8080");
    println!("🏥 Health check: http://127.0.0.1:8080/health");
    println!();
    println!("📋 Available endpoints:");
    println!("   GET /health                    - Health check");
    println!("   GET /gateway                   - API Gateway status");
    println!("   GET /api                       - REST API status");
    println!("   GET /services/*                - Backend services");
    println!("   GET /core/*                    - Core components");
    println!("   GET /data/mongodb              - MongoDB connection status");
    println!("   GET /data/mongodb/collections  - List MongoDB collections");
    println!("   GET /data/redis                - Redis connection status");
    println!("   GET /external/*                - External APIs");
    
    HttpServer::new(|| create_app())
        .bind("127.0.0.1:8080")?
        .run()
        .await
}
