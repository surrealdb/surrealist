import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildCodexSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Add the MCP server",
			description: dedent(`
				Codex has no dedicated installer — add Spectron to Codex's MCP configuration manually, as shown in the next steps. Create your API key first.

				<ApiKey />
			`),
		},
		{
			title: "Config location",
			description: dedent(`
				Codex reads MCP servers from \`~/.codex/config.toml\`. The installer creates or updates this file.

				~~~bash
				~/.codex/config.toml
				~~~
			`),
		},
		{
			title: "Configuration reference",
			description: dedent(`
				Codex talks to the streamable-HTTP MCP server directly. Send your agent API key as the bearer token and select this context with the X-Spectron-Context header.

				~~~toml
				[mcp_servers.spectron]
				url = "${mcpUrl}"
				bearer_token = "your-api-key"
				experimental_use_rmcp_client = true

				[mcp_servers.spectron.http_headers]
				X-Spectron-Context = "${context.id}"
				~~~
			`),
		},
		{
			title: "Verify",
			description:
				"Start Codex and confirm the Spectron memory and knowledge tools are listed for this session.",
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/mcp-server/coding-assistants/codex" />
			`),
		},
	];
}
