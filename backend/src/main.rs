mod server;
mod dbcodes;
mod api;
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    server::start_server().await
}
