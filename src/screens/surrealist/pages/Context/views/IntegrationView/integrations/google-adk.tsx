import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildGoogleAdkSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the package",
			description: dedent(`
				Give Google ADK agents persistent memory backed by this context, wrapped as ADK tools.

				~~~bash
				pip install spectron-google-adk
				~~~

				This pulls in \`google-adk\` and \`surrealdb\` (which provides the Spectron client).
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The toolset authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Add the toolset",
			description: dedent(`
				Build a \`SpectronToolset\` for this context and hand it to your agent as a single entry in its \`tools\` list. The endpoint and context id are pre-filled from your selection.

				~~~python
				from google.adk.agents import Agent
				from spectron_google_adk import SpectronToolset

				toolset = SpectronToolset(
				    context="${context.id}",
				    endpoint="${endpoint}",
				    api_key="your-api-key",
				)

				agent = Agent(
				    model="gemini-2.5-flash",
				    name="assistant",
				    description="An assistant with persistent memory.",
				    instruction="Store durable facts with remember and look things up with recall.",
				    tools=[toolset],
				)
				~~~

				Bind a \`session_id\` when you build the toolset to isolate memory per user or session.
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
