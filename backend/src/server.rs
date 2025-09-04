use actix_web::{web, App, HttpServer, middleware::Logger};
use crate::dbcodes::{mongo, redis};
use crate::api;  // Import the api module

// Configure all routes
fn configure_routes(cfg: &mut web::ServiceConfig) {
    cfg
        // Health check
        .route("/health", web::get().to(api::health_check))
        // API Gateway
        .route("/gateway", web::get().to(api::api_gateway))
        // Main API
        .route("/api", web::get().to(api::rest_api))
        // Backend Services
        .service(
            web::scope("/services")
                .route("/terminology", web::get().to(api::terminology_service))
                .route("/mapping", web::get().to(api::mapping_service))
                .route("/sync", web::get().to(api::sync_service))
                .route("/audit", web::get().to(api::audit_service))
        )
        // Core Components
        .service(
            web::scope("/core")
                .route("/fhir", web::get().to(api::fhir_engine))
                .route("/vocabulary", web::get().to(api::vocabulary_manager))
                .route("/translation", web::get().to(api::translation_engine))
        )
        // Data Layer
        .service(
            web::scope("/data")
                .route("/mongodb", web::get().to(api::mongodb_status))
                .route("/mongodb/collections", web::get().to(api::mongodb_collections))
                .route("/redis", web::get().to(api::redis_status))
        )
        // External APIs
        .service(
            web::scope("/external")
                .route("/who-icd11", web::get().to(api::who_api))
                .route("/namaste-csv", web::get().to(api::namaste_csv))
        )
        // Ayurveda
        .service(
            web::scope("/terminology")
                .route("/ayurveda", web::get().to(api::ayurveda_terminology))
        );
}

// Create the application
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
                .add(("Content-Type", "application/json"))
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
    println!("   GET /terminology/ayurveda      - Ayurveda terminology database");
    
    HttpServer::new(|| create_app())
        .bind("127.0.0.1:8080")?
        .run()
        .await
}
