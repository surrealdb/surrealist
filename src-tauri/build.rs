fn main() {
    tauri_build::build();

    let profile = std::env::var("PROFILE").unwrap();

    if profile == "debug" {
        println!("cargo:rustc-env=VITE_SURREALIST_PREVIEW=true");
    }
}
