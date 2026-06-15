import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildClaudeCodeSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Install the MCP server",
			description:
				"Run the installer once. It prompts for your API key and merges Spectron into your Claude Code configuration for this context.",
			code: `npx install-mcp spectron --client claude-code --context ${context.id}`,
			lang: "bash",
			action: "api_keys",
		},
		{
			title: "Config location",
			description:
				"Claude Code reads MCP servers from ~/.claude/mcp.json. The installer creates or updates this file.",
			code: "~/.claude/mcp.json",
			lang: "bash",
		},
		{
			title: "Configuration reference",
			description:
				"The block uses your context host for the MCP endpoint, your agent API key as a Bearer token, and the X-Spectron-Context header.",
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
			title: "Verify",
			description:
				"Restart Claude Code if it is running, then check that the seven Spectron memory and knowledge tools appear.",
			code: `claude "What MCP tools do you have access to?"
claude mcp list`,
			lang: "bash",
		},
		{
			title: "Explore Spectron",
			description:
				"See the full Claude Desktop and Claude Code setup guide, scope headers, and usage patterns.",
			action: "documentation",
			documentationUrl:
				"https://surrealdb.com/docs/spectron/integrations/mcp-server/coding-assistants/claude-desktop-and-code",
		},
	];
}
