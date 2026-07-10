import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildCrewAiSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Give your CrewAI agents provenance-first memory backed by this context. Requires Python 3.10+ and CrewAI 1.5+.

				~~~bash
				pip install spectron-integration-crewai
				~~~

				This pulls in CrewAI and the Spectron SDK (\`surrealdb[spectron]\`).
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
			title: "Provide credentials",
			description: dedent(`
				Supply the connection details through the environment. The endpoint and context id are pre-filled from your selection; keep the API key in your \`.env\`.

				~~~bash
				export SPECTRON_ENDPOINT="${endpoint}"
				export SPECTRON_CONTEXT="${context.id}"
				export SPECTRON_API_KEY="your-api-key"
				~~~
			`),
		},
		{
			title: "Enable automatic memory",
			description: dedent(`
				Attach \`SpectronMemory\` once and run your crew as usual — it recalls before each task, writes back after each task, and consolidates when the crew finishes. Prefer explicit control? Hand \`get_spectron_tools(scope=...)\` to an agent instead.

				~~~python
				from crewai import Agent, Task, Crew
				from spectron_crewai import SpectronMemory

				memory = SpectronMemory(default_scope="user/alex")
				memory.attach(verbose=True)

				agent = Agent(
				    role="Travel Planning Specialist",
				    goal="Plan trips that respect the traveller's known preferences",
				    backstory="You remember past trips and preferences.",
				    tools=memory.tools(),
				)

				task = Task(
				    description="Plan a weekend trip for Alex.",
				    expected_output="A day-by-day plan.",
				    agent=agent,
				)

				Crew(agents=[agent], tasks=[task]).kickoff()
				memory.close()
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
