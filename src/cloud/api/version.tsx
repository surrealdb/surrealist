import { compareVersions } from "compare-versions";
import { featureFlagsLock } from "~/providers/FeatureFlags";
import { featureFlags } from "~/util/feature-flags";
import { fetchAPI } from ".";

interface VersionInfo {
	version: string;
	ui_version: string;
}

/**
 * Returns whether the client is supported by the server
 */
export async function isClientSupported() {
	await featureFlagsLock;

	if (!featureFlags.get("cloud_killswitch")) {
		return true;
	}

	try {
		const res = await fetchAPI<VersionInfo>("/version");
		return compareVersions(import.meta.env.VERSION, res.ui_version) >= 0;
	} catch (err) {
		if (err instanceof Error) {
			return err;
		}

		return new Error(err as string);
	}
}
