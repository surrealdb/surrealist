import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildClaudeCodeSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Install the MCP server",
			description: dedent(`
				Install the Spectron plugin from the SurrealDB marketplace, running the command inside Claude Code. Provide your API key when prompted, or configure it manually as shown below.

				~~~bash
				/plugin install spectron@surrealdb
				~~~

				<ApiKey />
			`),
		},
		{
			title: "Config location",
			description: dedent(`
				Claude Code reads MCP servers from \`~/.claude/mcp.json\`. The installer creates or updates this file.

				~~~bash
				~/.claude/mcp.json
				~~~
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				The block uses your context host for the MCP endpoint, your agent API key as a Bearer token, and the X-Spectron-Context header.

				~~~json
				{
				  "mcpServers": {
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
				Restart Claude Code if it is running, then check that the seven Spectron memory and knowledge tools appear.

				~~~bash
				claude "What MCP tools do you have access to?"
				claude mcp list
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full Claude Desktop and Claude Code setup guide, scope headers, and usage patterns.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/mcp-server/coding-assistants/claude-desktop-and-code" />
			`),
		},
	];
}
