/**
 * Minimal `node:fs` stub for PostCSS in the browser. `dom-to-svg` only uses
 * `postcss.parse` on CSS strings; previous-map file reads are never needed, but
 * PostCSS still imports `fs` at module scope.
 */
export function existsSync(): boolean {
	return false;
}

export function readFileSync(): string {
	return "";
}
