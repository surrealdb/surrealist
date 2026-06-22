import { useConfigStore } from "~/stores/config";
import { featureFlags } from "~/util/feature-flags";

export function getCloudEndpoints() {
	const { urlApiBase, urlApiTicketsBase } = useConfigStore.getState().settings.cloud;
	const isCustom = featureFlags.get("cloud_endpoints") === "custom";

	const defaultApiBase = import.meta.env.VITE_CLOUD_API_BASE ?? "";
	const defaultApiTicketsBase = import.meta.env.VITE_CLOUD_API_TICKETS_BASE ?? "";

	return {
		apiBase: isCustom ? urlApiBase : defaultApiBase,
		ticketsBase: isCustom ? urlApiTicketsBase : defaultApiTicketsBase,
	};
}

export function getWebsiteBase() {
	const { urlWebsiteBase } = useConfigStore.getState().settings.cloud;
	const isCustom = featureFlags.get("website_base") === "custom";
	const defaultWebsiteBase =
		import.meta.env.VITE_SURREALIST_WEBSITE_BASE ?? "https://surrealdb.com";

	return isCustom ? urlWebsiteBase : defaultWebsiteBase;
}
