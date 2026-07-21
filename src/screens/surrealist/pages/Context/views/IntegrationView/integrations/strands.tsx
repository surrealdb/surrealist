import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildStrandsSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Expose this context's memory operations as tools for any Strands agent. Requires Python 3.10+.

				~~~bash
				pip install spectron-strands-agents
				~~~

				This pulls in \`strands-agents\` and \`surrealdb\` (which provides the Spectron client).
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The tools authenticate with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Provide credentials",
			description: dedent(`
				Supply the connection details through the environment. The endpoint and context id are pre-filled from your selection.

				~~~bash
				export SPECTRON_ENDPOINT="${endpoint}"
				export SPECTRON_CONTEXT="${context.id}"
				export SPECTRON_API_KEY="your-api-key"
				~~~
			`),
		},
		{
			title: "Attach the tools",
			description: dedent(`
				With the environment set, \`spectron_tools()\` builds the client for you and returns seven memory tools — \`spectron_remember\`, \`spectron_recall\`, \`spectron_context\`, \`spectron_reflect\`, \`spectron_forget\`, \`spectron_upload\`, and \`spectron_inspect\`.

				~~~python
				from strands import Agent
				from spectron_strands import spectron_tools

				agent = Agent(tools=spectron_tools(scope="user/alex"))

				agent("Remember that we signed a contract with Meditech Solutions for 1.2M GBP.")
				print(agent("What is the value of the Meditech Solutions contract?"))
				~~~

				Narrow the set with \`include=[...]\` or \`exclude=[...]\`, using the bare names (\`remember\`, \`recall\`, …) as filter values.
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
