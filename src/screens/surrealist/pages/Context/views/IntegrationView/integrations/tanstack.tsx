import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildTanStackSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Install the packages",
			description: dedent(`
				TanStack AI ships a first-party MCP host client. Add it alongside the core package, the MCP SDK peer dependency, and your chosen provider adapter.

				~~~bash
				npm install @tanstack/ai @tanstack/ai-mcp @modelcontextprotocol/sdk @tanstack/ai-openai
				~~~
			`),
		},
		{
			title: "Create API credentials",
			description: dedent(`
				The MCP client authenticates with an agent API key for this context. Create one here if you have not already.

				<ApiKey />
			`),
		},
		{
			title: "Connect the MCP server",
			description: dedent(`
				In a server route — MCP tool execution is server-side only — create a client for Spectron over the streamable HTTP transport. The endpoint is pre-filled from your selection; send your API key as a Bearer token and select this context with the X-Spectron-Context header.

				~~~typescript
				import { createMCPClient } from "@tanstack/ai-mcp";

				const spectron = await createMCPClient({
				    transport: {
				        type: "http",
				        url: "${mcpUrl}",
				        headers: {
				            Authorization: "Bearer your-api-key",
				            "X-Spectron-Context": "${context.id}",
				        },
				    },
				});
				~~~
			`),
		},
		{
			title: "Pass the tools to chat",
			description: dedent(`
				Hand the client to \`chat\` under \`mcp.clients\`. TanStack AI discovers Spectron's memory and knowledge tools, exposes them to the model, and closes the client when the run finishes.

				~~~typescript
				import { chat } from "@tanstack/ai";
				import { openaiText } from "@tanstack/ai-openai";

				const stream = chat({
				    adapter: openaiText("gpt-4o"),
				    messages,
				    mcp: { clients: [spectron] },
				});
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/frameworks/tanstack-ai" />
			`),
		},
	];
}
