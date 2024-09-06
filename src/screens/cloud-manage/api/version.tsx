import { compareVersions } from "compare-versions";
import { fetchAPI } from ".";

interface VersionInfo {
	version: string;
	ui_version: string;
}

/**
 * Returns whether the client is supported by the server
 */
export async function isClientSupported() {
	const res = await fetchAPI<VersionInfo>("/version");

	return compareVersions(import.meta.env.VERSION, res.ui_version) >= 0;
}