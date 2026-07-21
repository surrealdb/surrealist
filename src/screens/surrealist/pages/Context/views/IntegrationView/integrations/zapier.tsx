import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildZapierSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description: dedent(`
				Zapier authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Add an MCP server",
			description: dedent(`
				In Zapier, open MCP and add a new server. Choose a custom streamable HTTP server and point it at your context host.

				~~~bash
				${mcpUrl}
				~~~
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				Send your API key as a Bearer token and select this context with the X-Spectron-Context header.

				~~~json
				{
				  "url": "${mcpUrl}",
				  "headers": {
				    "Authorization": "Bearer your-api-key",
				    "X-Spectron-Context": "${context.id}"
				  }
				}
				~~~
			`),
		},
		{
			title: "Verify",
			description: dedent(`
				Confirm the Spectron memory and knowledge tools appear in the server's tool list, then reference them from any Zap.
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/mcp-server/install" />
			`),
		},
	];
}
