import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildMcpSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description: dedent(`
				The MCP server authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "MCP endpoint",
			description: dedent(`
				Spectron exposes a streamable HTTP MCP server. Point any MCP-compatible client at this URL.

				~~~bash
				${mcpUrl}
				~~~
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				Most MCP clients accept a server entry like this. Send your API key as a Bearer token and select this context with the X-Spectron-Context header.

				~~~json
				{
				  "mcpServers": {
				    "spectron": {
				      "url": "${mcpUrl}",
				      "headers": {
				        "Authorization": "Bearer your-api-key",
				        "X-Spectron-Context": "${context.id}"
				      }
				    }
				  }
				}
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				Read the MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/mcp-server/install" />
			`),
		},
	];
}
