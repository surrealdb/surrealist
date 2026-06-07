/**
 * `@surrealdb/ql-wasm` falls back to `import("node:crypto")` when `globalThis.crypto`
 * is missing. Vite still resolves that import and warns; alias here so the browser
 * bundle uses the Web Crypto API only.
 */
const webCrypto = globalThis.crypto;
if (!webCrypto) {
	throw new Error("Web Crypto API is not available");
}

export default webCrypto;
