import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildVercelAiSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the bridge package",
			description:
				"Add the Spectron helper for the Vercel AI SDK. It wraps streamText and generateText to inject recalled memory and record turns on this context.",
			code: "npm install spectron-ai-sdk ai @ai-sdk/openai",
			lang: "bash",
		},
		{
			title: "Create API credentials",
			description:
				"The createSpectron helper needs a Spectron agent key with access to this context. Generate one if you have not already.",
			action: "api_keys",
		},
		{
			title: "Initialise Spectron",
			description:
				"Set context to this deployment, point baseUrl at the same host you see in SurrealDB Cloud, and keep the client at module scope in your route handlers.",
			code: `import { createSpectron } from "spectron-ai-sdk";

const spectron = createSpectron({
    context: "${context.id}",
    apiKey: process.env.SPECTRON_API_KEY!,
    baseUrl: "${endpoint}",
});`,
			lang: "typescript",
		},
		{
			title: "Stream from a session",
			description:
				"Create or resume a session per conversation, then call session.streamText so recall and turn recording happen around the model call.",
			code: `import { openai } from "@ai-sdk/openai";

const session = await spectron.createSession({
    scope: { org: "acme", agent: "web-assistant", user: "alex" },
});

const result = await session.streamText({
    model: openai("gpt-4o"),
    system: "You are a helpful assistant with long-term memory.",
    messages,
});

return result.toDataStreamResponse();`,
			lang: "typescript",
		},
		{
			title: "Explore Spectron",
			description:
				"Configuration options, session lifecycle, generateText memory diffs, and Next.js route patterns.",
			action: "documentation",
			documentationUrl:
				"https://surrealdb.com/docs/spectron/integrations/frameworks/vercel-ai-sdk",
		},
	];
}
