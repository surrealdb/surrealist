import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Connect } from "vite";

/**
 * Serve pre-gzipped `.wasm` assets with `Content-Encoding: gzip`.
 *
 * The build replaces raw wasm bytes with gzip payloads (same `.wasm`
 * extension) for S3 uploads that set `--content-encoding gzip`. Static
 * file servers that omit that header make `WebAssembly.instantiateStreaming`
 * read gzip magic (`1f 8b`) instead of wasm magic (`\0asm`).
 */
export function servePrecompressedWasm(middlewares: Connect.Server, distDir: string): void {
	middlewares.use((req, res, next) => {
		const pathname = req.url?.split("?", 1)[0];
		if (!pathname?.endsWith(".wasm")) {
			return next();
		}

		const filePath = join(distDir, pathname);
		if (!existsSync(filePath)) {
			return next();
		}

		const file = readFileSync(filePath);
		if (file[0] !== 0x1f || file[1] !== 0x8b) {
			return next();
		}

		res.setHeader("Content-Type", "application/wasm");
		res.setHeader("Content-Encoding", "gzip");
		res.setHeader("Content-Length", file.length);
		res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
		res.end(file);
	});
}
