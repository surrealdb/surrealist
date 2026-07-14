import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildOpenAiAgentsSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Give agents built with the OpenAI Agents SDK a durable, shared memory backed by this context.

				~~~bash
				pip install spectron-openai-agents

				# During the Spectron preview, install the SDK extra too:
				pip install "spectron-openai-agents[spectron]"
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
			title: "Configure credentials",
			description: dedent(`
				Export your model key and the Spectron connection details. The endpoint is pre-filled from your selection.

				~~~bash
				export OPENAI_API_KEY="your-openai-api-key"
				export SPECTRON_URL="${endpoint}"
				export SPECTRON_CONTEXT="${context.id}"
				export SPECTRON_TOKEN="your-api-key"
				~~~
			`),
		},
		{
			title: "Add memory",
			description: dedent(`
				Hand the agent memory tools it calls itself, or let \`run_with_memory\` recall, inject, and store around each run with no tools on the agent.

				~~~python
				from agents import Agent, Runner
				from spectron_openai_agents import get_spectron_tools

				agent = Agent(
				    name="assistant",
				    instructions=(
				        "You are a helpful assistant. Use recall to check memory before "
				        "you answer, and use remember to store anything worth keeping."
				    ),
				    tools=get_spectron_tools(session_id="user-123"),
				)

				Runner.run_sync(agent, "My name is Ada and I work on databases.")

				result = Runner.run_sync(agent, "What do you know about me?")
				print(result.final_output)
				~~~
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
