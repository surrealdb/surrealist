import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildZedSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description: dedent(`
				Zed authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Config location",
			description: dedent(`
				Zed registers MCP servers as context servers in \`settings.json\`. Open it with "zed: open settings" from the command palette.

				~~~bash
				~/.config/zed/settings.json
				~~~
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				Add Spectron under \`context_servers\`. Point it at your context host, send your API key as a Bearer token, and select this context with the X-Spectron-Context header.

				~~~json
				{
				  "context_servers": {
				    "spectron": {
				      "source": "custom",
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
			title: "Verify",
			description: dedent(`
				Open the Agent Panel and confirm Spectron appears under its tools. The memory and knowledge tools are then available to the assistant.
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/mcp-server/coding-assistants/zed" />
			`),
		},
	];
}
