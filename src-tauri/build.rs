fn main() {
    tauri_build::build();

    if std::env::var("VITE_SURREALIST_PREVIEW").is_err() {
        println!("cargo:rustc-env=VITE_SURREALIST_PREVIEW=false");
    }
}
