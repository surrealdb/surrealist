import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildEveSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Add the Spectron adapter for Eve, alongside the Eve SDK and Zod.

				~~~bash
				bun add @surrealdb/spectron-eve eve zod
				~~~
			`),
		},
		{
			title: "Create API credentials",
			description: dedent(`
				The adapter authenticates with an agent API key for this context. Create one here if you have not already.

				<ApiKey />
			`),
		},
		{
			title: "Configure the client",
			description: dedent(`
				Register a shared Spectron client for your agent. The endpoint and context id are pre-filled from your selection.

				~~~typescript
				import { createSpectronClient, setSharedSpectronClient } from "@surrealdb/spectron-eve";

				setSharedSpectronClient(
				    createSpectronClient({
				        context: "${context.id}",
				        endpoint: "${endpoint}",
				        apiKey: "your-api-key",
				    }),
				);
				~~~
			`),
		},
		{
			title: "Enable auto-memory",
			description: dedent(`
				Drop in two resolver files and your agent gains persistent memory automatically — recalling relevant context before each turn and remembering new facts after it.

				~~~typescript
				// agent/instructions/memory.ts
				import { spectronMemoryInstructions } from "@surrealdb/spectron-eve";
				export default spectronMemoryInstructions();

				// agent/hooks/memory.ts
				import { spectronMemoryHook } from "@surrealdb/spectron-eve";
				export default spectronMemoryHook();
				~~~

				Prefer explicit control? Expose the \`remember\`, \`recall\`, \`forget\`, \`entities\`, and \`timeline\` tools from \`@surrealdb/spectron-eve/tools\` instead.
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				Discover the full potential of Spectron with the official documentation.

				<Documentation />
			`),
		},
	];
}
