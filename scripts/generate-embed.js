import { Dir } from "./_helpers.js";

if (process.platform == 'win32') {
	console.error('Due to build limitations this script cannot be run on Windows. Please use WSL or a Linux VM.');
	process.exit(1);
}

const embed = new Dir('./src-embed');

embed.exec('cargo build --target wasm32-unknown-unknown --release');
embed.exec('wasm-bindgen ./target/wasm32-unknown-unknown/release/surrealist_embed.wasm --out-dir ./dist --out-name surrealist-embed --target web');
embed.exec('cp ./dist/* ../src/generated/');