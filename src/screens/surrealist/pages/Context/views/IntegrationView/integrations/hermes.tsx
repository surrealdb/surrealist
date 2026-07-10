import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildHermesSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the provider",
			description: dedent(`
				The Spectron memory provider gives a Hermes Agent long-term memory: it recalls relevant memories before every turn, writes each completed turn back to Spectron, and consolidates memory when a session ends. Requires Python 3.10+.

				~~~bash
				pip install spectron-integration-hermes-agent
				~~~

				This pulls in the Spectron SDK (\`surrealdb[spectron]\`) and registers the provider with Hermes.
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The provider authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Provide credentials",
			description: dedent(`
				Supply the connection details via the environment. The endpoint and context id are pre-filled from your selection; keep the API key in your \`.env\`.

				~~~bash
				export SPECTRON_ENDPOINT="${endpoint}"
				export SPECTRON_CONTEXT="${context.id}"
				export SPECTRON_API_KEY="your-api-key"
				~~~
			`),
		},
		{
			title: "Activate the provider",
			description: dedent(`
				Select Spectron as the memory provider, then confirm it is active. Hermes prompts for any missing settings and writes the non-secret ones to \`$HERMES_HOME/spectron.json\`.

				~~~bash
				hermes memory setup      # choose "spectron"
				hermes memory status     # confirm it is active
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				The agent can also call the \`spectron_recall\`, \`spectron_remember\`, \`spectron_context\`, \`spectron_forget\`, \`spectron_reflect\`, and \`spectron_upload\` tools directly. See the documentation for the full provider reference.

				<Documentation />
			`),
		},
	];
}
