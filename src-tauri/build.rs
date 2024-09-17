fn main() {
    tauri_build::build();

    if let Err(_) = std::env::var("VITE_SURREALIST_PREVIEW") {
        println!("cargo:rustc-env=VITE_SURREALIST_PREVIEW=false");
    }
}
