import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildMcpSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description:
				"The MCP server authenticates with a scoped API key bound to your principal. Create one for this context.",
			action: "api_keys",
		},
		{
			title: "MCP endpoint",
			description:
				"Spectron exposes a streamable HTTP MCP server. Point any MCP-compatible client at this URL.",
			code: mcpUrl,
			lang: "bash",
		},
		{
			title: "Configuration reference",
			description:
				"Most MCP clients accept a server entry like this. Send your API key as a Bearer token and select this context with the X-Spectron-Context header.",
			code: `{
  "mcpServers": {
    "spectron": {
      "url": "${mcpUrl}",
      "headers": {
        "Authorization": "Bearer your-api-key",
        "X-Spectron-Context": "${context.id}"
      }
    }
  }
}`,
			lang: "json",
		},
		{
			title: "Explore Spectron",
			description:
				"Read the MCP server reference for the available memory and knowledge tools, scope headers, and authentication.",
			action: "documentation",
			documentationUrl: "https://surrealdb.com/docs/spectron/integrations/mcp-server",
		},
	];
}
