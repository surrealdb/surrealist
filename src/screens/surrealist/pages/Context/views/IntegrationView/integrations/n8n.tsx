import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildN8nSteps(context: CloudContext): IntegrationStep[] {
	const { restRoot } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description: dedent(`
				n8n workflows call Spectron over HTTPS with the same Bearer token as the REST API. Create a key scoped to this context.

				<ApiKey />
			`),
		},
		{
			title: "Recall memory (HTTP Request)",
			description: dedent(`
				Before your LLM or Agent node, add an HTTP Request node that recalls ranked memory for the incoming message. Send the API key as a Bearer token.

				~~~bash
				# POST ${restRoot}/context

				# Headers:
				#   Authorization: Bearer {{ $env.SPECTRON_API_KEY }}
				#   Content-Type: application/json

				# Body:
				{
				  "query": "{{ $json.chatInput }}",
				  "scope": ["user/{{ $json.userId }}"],
				  "k": 8
				}
				~~~
			`),
		},
		{
			title: "Store the turn (HTTP Request)",
			description: dedent(`
				After the agent responds, add another HTTP Request node that persists the exchange so Spectron can extract memory. Post a \`turns\` array to \`/facts/batch\`.

				~~~bash
				# POST ${restRoot}/facts/batch

				# Headers:
				#   Authorization: Bearer {{ $env.SPECTRON_API_KEY }}
				#   Content-Type: application/json

				# Body:
				{
				  "turns": [
				    { "role": "user", "content": "{{ $json.chatInput }}" },
				    { "role": "assistant", "content": "{{ $json.output }}" }
				  ],
				  "scope": ["user/{{ $json.userId }}"]
				}
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				Read the n8n integration guide for wiring these nodes into a chat workflow, plus the SurrealDB community node for direct database access.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/automation/n8n" />
			`),
		},
	];
}
