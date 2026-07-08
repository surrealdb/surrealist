import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildVsCodeSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description: dedent(`
				VS Code authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Config location",
			description: dedent(`
				VS Code reads MCP servers from \`.vscode/mcp.json\` in your workspace, or from your user \`mcp.json\` to share them across projects.

				~~~bash
				.vscode/mcp.json
				~~~
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				Register Spectron as a streamable HTTP server. Send your API key as a Bearer token and select this context with the X-Spectron-Context header.

				~~~json
				{
				  "servers": {
				    "spectron": {
				      "type": "http",
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
				Open the Chat view in agent mode and run "MCP: List Servers" from the Command Palette to confirm Spectron is connected and its tools are available.
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/mcp-server/coding-assistants/vscode" />
			`),
		},
	];
}
