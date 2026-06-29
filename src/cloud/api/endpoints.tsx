import { useConfigStore } from "~/stores/config";
import { featureFlags } from "~/util/feature-flags";

export function getCloudEndpoints() {
	const { urlApiBase } = useConfigStore.getState().settings.cloud;
	const isCustom = featureFlags.get("cloud_endpoints") === "custom";

	const defaultApiBase = import.meta.env.VITE_CLOUD_API_BASE ?? "";

	return {
		apiBase: isCustom ? urlApiBase : defaultApiBase,
	};
}

const DEFAULT_API_BASE = "https://api.surrealdb.com";

export function getApiBase() {
	const { urlSurrealApiBase } = useConfigStore.getState().settings.cloud;
	const isCustom = featureFlags.get("cloud_endpoints") === "custom";

	return isCustom && urlSurrealApiBase ? urlSurrealApiBase : DEFAULT_API_BASE;
}

export function getWebsiteBase() {
	const { urlWebsiteBase } = useConfigStore.getState().settings.cloud;
	const isCustom = featureFlags.get("website_base") === "custom";
	const defaultWebsiteBase =
		import.meta.env.VITE_SURREALIST_WEBSITE_BASE ?? "https://surrealdb.com";

	return isCustom ? urlWebsiteBase : defaultWebsiteBase;
}
