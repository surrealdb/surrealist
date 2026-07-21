import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildTanStackSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the packages",
			description: dedent(`
				TanStack AI works with Spectron through the \`@surrealdb/spectron\` SDK directly — there is no dedicated MCP adapter. Add it alongside the core package and your provider adapter.

				~~~bash
				npm install @surrealdb/spectron @tanstack/ai @tanstack/ai-openai
				~~~
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The SDK authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Configure the client",
			description: dedent(`
				In a server handler (Spectron runs server-side, wherever you call \`chat()\`), construct a client for this context. The endpoint and context id are pre-filled from your selection.

				~~~typescript
				import { Spectron } from "@surrealdb/spectron";
				import { chat, toServerSentEventsResponse } from "@tanstack/ai";
				import { openaiText } from "@tanstack/ai-openai";

				const spectron = new Spectron({
				    endpoint: "${endpoint}",
				    context: "${context.id}",
				    apiKey: "your-api-key",
				});
				~~~
			`),
		},
		{
			title: "Recall memory into chat",
			description: dedent(`
				Recall relevant memory with \`spectron.context\`, inject it into the system prompt for \`chat()\`, and stream the response back.

				~~~typescript
				const memory = await spectron.context(message, { scope, k: 8 });

				const stream = chat({
				    adapter: openaiText("gpt-4o"),
				    messages: [
				        { role: "system", content: \`You are a helpful assistant.\\n\\n## Memory\\n\${memory}\` },
				        { role: "user", content: message },
				    ],
				});

				return toServerSentEventsResponse(stream);
				~~~

				To persist the exchange, collect the reply with \`streamToText\` and call \`spectron.rememberMany([...], { scope })\`. Prefer the model to decide when to recall? Expose it as a \`toolDefinition\` whose \`.server()\` handler calls \`spectron.context\`, and pass it via \`tools: [recall]\`.
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				See the full TanStack AI guide for tool-based recall, streaming, and scope handling.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/ai-sdks/tanstack-ai" />
			`),
		},
	];
}
