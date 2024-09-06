import { compareVersions } from "compare-versions";
import { fetchAPI } from ".";
import { featureFlags } from "~/util/feature-flags";
import { sleep } from "radash";

interface VersionInfo {
	version: string;
	ui_version: string;
}

/**
 * Returns whether the client is supported by the server
 */
export async function isClientSupported() {

	// This function is called before feature flags are processed
	// so we need to wait a bit before checking the killswitch
	await sleep(50);

	if (!featureFlags.get("cloud_killswitch")) {
		return true;
	}

	const res = await fetchAPI<VersionInfo>("/version");

	return compareVersions(import.meta.env.VERSION, res.ui_version) >= 0;
}