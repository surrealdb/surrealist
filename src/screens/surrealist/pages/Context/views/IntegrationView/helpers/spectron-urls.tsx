import type { CloudContext } from "~/types";

export function getSpectronUrls(context: CloudContext) {
	const endpoint = `https://${context.host}`;
	return {
		endpoint,
		restRoot: `${endpoint}/api/v1/${context.id}`,
		mcpUrl: `${endpoint}/mcp`,
	};
}
