import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildPydanticAiSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Connect this context to Pydantic AI through its own extension points — memory tools, auto-recall, and persistence.

				~~~bash
				pip install spectron-pydantic-ai
				~~~

				To run against a live instance and a model provider, add \`"pydantic-ai-slim[openai]"\` and \`"surrealdb[spectron]"\`.
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
			title: "Connect the toolset",
			description: dedent(`
				Connect \`SpectronMemory\` to this context and expose it to your agent as a toolset. The endpoint is pre-filled from your selection.

				~~~python
				import asyncio
				from pydantic_ai import Agent
				from spectron_pydantic_ai import SpectronMemory, SpectronToolset

				async def main():
				    memory = SpectronMemory.connect(
				        url="${endpoint}",
				        namespace="${context.id}",
				        token="your-api-key",
				        user_id="alex",
				    )
				    agent = Agent("openai:gpt-4o", toolsets=[SpectronToolset(memory)])
				    result = await agent.run("Remember that I prefer window seats.")
				    print(result.output)

				asyncio.run(main())
				~~~

				For memory injected before every run with no tool call, attach \`spectron_history_processor(memory)\` instead.
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
