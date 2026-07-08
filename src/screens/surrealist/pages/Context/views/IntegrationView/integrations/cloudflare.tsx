import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildCloudflareSteps(context: CloudContext): IntegrationStep[] {
	const { mcpUrl } = getSpectronUrls(context);

	return [
		{
			title: "Install the packages",
			description: dedent(`
				The Cloudflare Agents SDK ships a built-in MCP client. Add it alongside the AI SDK and the Workers AI provider.

				~~~bash
				npm install agents ai workers-ai-provider
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
				From your Agent, connect Spectron as a streamable HTTP server. The endpoint is pre-filled from your selection; send your API key as a Bearer token and select this context with the X-Spectron-Context header.

				~~~typescript
				import { Agent } from "agents";

				export class MemoryAgent extends Agent<Env> {
				    async onStart() {
				        await this.addMcpServer("spectron", "${mcpUrl}", {
				            transport: {
				                type: "streamable-http",
				                headers: {
				                    Authorization: "Bearer your-api-key",
				                    "X-Spectron-Context": "${context.id}",
				                },
				            },
				        });
				    }
				}
				~~~
			`),
		},
		{
			title: "Call the tools from your model",
			description: dedent(`
				The connected server's memory and knowledge tools are exposed as AI SDK tools through \`this.mcp.getAITools()\`. Pass them to any model call so the agent can recall and remember.

				~~~typescript
				import { streamText } from "ai";
				import { createWorkersAI } from "workers-ai-provider";

				async onRequest(request: Request) {
				    const workersai = createWorkersAI({ binding: this.env.AI });

				    const result = await streamText({
				        model: workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
				        prompt: "What are the user's preferences?",
				        tools: this.mcp.getAITools(),
				    });

				    return result.toTextStreamResponse();
				}
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full MCP server reference for the available memory and knowledge tools, scope headers, and authentication.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/frameworks/cloudflare" />
			`),
		},
	];
}
