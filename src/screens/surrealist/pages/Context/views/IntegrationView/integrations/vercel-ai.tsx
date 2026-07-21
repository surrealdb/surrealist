import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildVercelAiSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Add the Spectron integration for the Vercel AI SDK, alongside \`ai\` (v7) and the Spectron client. Keep using your own model provider.

				~~~bash
				npm i @surrealdb/spectron-vercel-ai ai @surrealdb/spectron
				# plus your model provider, e.g.
				npm i @ai-sdk/openai
				~~~
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The integration authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Create the Spectron instance",
			description: dedent(`
				Construct a Spectron instance pointed at this context. The endpoint and context id are pre-filled from your selection, and \`defaultScopes\` binds reads and writes to a region of memory.

				~~~typescript
				import { createSpectron, Spectron } from "@surrealdb/spectron-vercel-ai";

				const spectron = createSpectron({
				    client: new Spectron({
				        context: "${context.id}",
				        endpoint: "${endpoint}",
				        apiKey: "your-api-key",
				    }),
				    defaultScopes: "user/alex",
				});
				~~~

				\`createSpectron()\` also reads \`SPECTRON_ENDPOINT\`, \`SPECTRON_API_KEY\`, and \`SPECTRON_CONTEXT\` from the environment when no client is passed.
			`),
		},
		{
			title: "Wrap your model",
			description: dedent(`
				Wrap your model with \`wrapLanguageModel\`. The middleware injects relevant memory before generation and stores each exchange afterwards. \`streamText\` works identically, and memory operations are fail-open.

				~~~typescript
				import { openai } from "@ai-sdk/openai";
				import { generateText, wrapLanguageModel } from "ai";

				const model = wrapLanguageModel({
				    model: openai("gpt-4o"),
				    middleware: spectron.middleware({ sessionId: "session-123" }),
				});

				const { text } = await generateText({
				    model,
				    prompt: "What should I focus on today?",
				});
				~~~
			`),
		},
		{
			title: "Expose memory tools",
			description: dedent(`
				Optionally hand the model a tool set so it can query memory on demand mid-generation.

				~~~typescript
				import { generateText, stepCountIs } from "ai";

				const { text } = await generateText({
				    model,
				    tools: spectron.tools({ sessionId: "session-123" }),
				    stopWhen: stepCountIs(3),
				    prompt: "Based on our past conversations, what do I care about most?",
				});
				~~~

				This exposes the \`spectron_recall\`, \`spectron_context\`, \`spectron_reflect\`, \`spectron_remember\`, \`spectron_forget\`, \`spectron_profile\`, and \`spectron_inspect\` tools.
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				The official documentation covers the rest of what Spectron can do.

				<Documentation />
			`),
		},
	];
}
