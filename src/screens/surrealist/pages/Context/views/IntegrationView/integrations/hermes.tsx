import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildHermesSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description: dedent(`
				Hermes authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Config location",
			description: dedent(`
				Hermes reads MCP servers from \`~/.hermes/mcp.json\`. Create the file if it does not exist yet.

				~~~bash
				~/.hermes/mcp.json
				~~~
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				Add Spectron as a custom server. Point it at your context host, send your API key as a Bearer token, and select this context with the X-Spectron-Context header.

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
			title: "Verify",
			description: dedent(`
				Restart Hermes and confirm the Spectron memory and knowledge tools are listed for the session.
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/mcp-server" />
			`),
		},
	];
}
