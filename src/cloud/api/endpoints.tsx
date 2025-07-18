import { useConfigStore } from "~/stores/config";
import { featureFlags } from "~/util/feature-flags";

const CLOUD_AUTH_BASE = "https://auth.surrealdb.com";
const CLOUD_API_BASE = "https://api.cloud.surrealdb.com/api/v1";
const CLOUD_API_MGMT_BASE = "https://api.cloud.surrealdb.com/management/v1";
const CLOUD_API_TICKETS_BASE = "https://api.tickets.surrealdb.com";

export function getCloudEndpoints() {
	const { urlAuthBase, urlApiBase, urlApiMgmtBase, urlApiTicketsBase } =
		useConfigStore.getState().settings.cloud;
	const isCustom = featureFlags.get("cloud_endpoints") === "custom";

	return {
		authBase: isCustom ? urlAuthBase : CLOUD_AUTH_BASE,
		apiBase: isCustom ? urlApiBase : CLOUD_API_BASE,
		mgmtBase: isCustom ? urlApiMgmtBase : CLOUD_API_MGMT_BASE,
		ticketsBase: isCustom ? urlApiTicketsBase : CLOUD_API_TICKETS_BASE,
	};
}
