import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildCursorSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Install the MCP server",
			description:
				"Run the installer once. It prompts for your API key and adds Spectron to Cursor's MCP configuration for this context.",
			code: `npx install-mcp spectron --client cursor --context ${context.id}`,
			lang: "bash",
			action: "api_keys",
		},
		{
			title: "Config location",
			description:
				"Cursor reads MCP servers from ~/.cursor/mcp.json (global) or .cursor/mcp.json (per project). The installer creates or updates this file.",
			code: "~/.cursor/mcp.json",
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
				"Open Cursor → Settings → MCP and confirm the Spectron server is connected and its memory and knowledge tools are listed.",
		},
		{
			title: "Explore Spectron",
			description:
				"See the full Cursor setup guide, scope headers, and usage patterns in the documentation.",
			action: "documentation",
			documentationUrl:
				"https://surrealdb.com/docs/spectron/integrations/mcp-server/coding-assistants/cursor",
		},
	];
}
