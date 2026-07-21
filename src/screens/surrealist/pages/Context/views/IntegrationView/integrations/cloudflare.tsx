import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildCloudflareSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Spectron runs inside a Cloudflare Worker through the \`@surrealdb/spectron\` SDK — no MCP client required. Add it to your Worker project.

				~~~bash
				npm install @surrealdb/spectron
				~~~
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The Worker authenticates with a scoped API key bound to your principal. Create one for this context, then store it as a secret with \`npx wrangler secret put SPECTRON_API_KEY\`.

				<ApiKey />
			`),
		},
		{
			title: "Configure the Worker",
			description: dedent(`
				Bind Workers AI and expose the Spectron connection details. The endpoint and context id are pre-filled from your selection; the API key comes from the secret you set.

				~~~toml
				[ai]
				binding = "AI"

				[vars]
				SPECTRON_ENDPOINT = "${endpoint}"
				SPECTRON_CONTEXT = "${context.id}"
				~~~

				~~~typescript
				interface Env {
				    AI: Ai;
				    SPECTRON_ENDPOINT: string;
				    SPECTRON_CONTEXT: string;
				    SPECTRON_API_KEY: string;
				}
				~~~
			`),
		},
		{
			title: "Recall, generate, and remember",
			description: dedent(`
				Construct a client from the environment, recall relevant memory into the system prompt, run a Workers AI model, then persist the exchange with \`rememberMany\`.

				~~~typescript
				import { Spectron } from "@surrealdb/spectron";

				export default {
				    async fetch(request: Request, env: Env): Promise<Response> {
				        const { userId, message } = await request.json();
				        const scope = [\`user/\${userId}\`];

				        const spectron = new Spectron({
				            endpoint: env.SPECTRON_ENDPOINT,
				            context: env.SPECTRON_CONTEXT,
				            apiKey: env.SPECTRON_API_KEY,
				        });

				        const memory = await spectron.context(message, { scope, k: 8 });

				        const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
				            messages: [
				                { role: "system", content: \`You are a helpful assistant.\\n\\n## Memory\\n\${memory}\` },
				                { role: "user", content: message },
				            ],
				        });

				        await spectron.rememberMany(
				            [
				                { role: "user", content: message },
				                { role: "assistant", content: result.response },
				            ],
				            { scope },
				        );

				        return Response.json({ text: result.response });
				    },
				};
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full Cloudflare Workers AI guide for streaming, tool-based recall, and background writes.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/ai-sdks/cloudflare-workers-ai" />
			`),
		},
	];
}
