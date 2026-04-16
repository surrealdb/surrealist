/**
 * Minimal `node:url` subset (`fileURLToPath`, `pathToFileURL`) for PostCSS when
 * bundled for the browser (via `dom-to-svg`). Real Node `url` is not available
 * in the client; PostCSS only needs these for source-map / error paths.
 */
export function pathToFileURL(filepath: string): URL {
	const normalized = filepath.replace(/\\/g, "/");
	if (/^[A-Za-z]:/.test(normalized)) {
		return new URL(`file:///${normalized}`);
	}
	const withSlash = normalized.startsWith("/") ? normalized : `/${normalized}`;
	return new URL(`file://${withSlash}`);
}

export function fileURLToPath(fileUrl: string | URL): string {
	const u = typeof fileUrl === "string" ? new URL(fileUrl) : fileUrl;
	if (u.protocol !== "file:") {
		throw new TypeError("The URL must be of scheme file");
	}
	const pathname = u.pathname;
	if (pathname.length >= 3 && pathname[0] === "/" && pathname[2] === ":") {
		return pathname.slice(1).replace(/\//g, "\\");
	}
	return decodeURIComponent(pathname);
}
