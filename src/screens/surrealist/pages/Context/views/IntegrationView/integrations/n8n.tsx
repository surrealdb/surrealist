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
				n8n workflows call Spectron over HTTPS with the same API-KEY header as the REST API. Create a key scoped to this context.

				<ApiKey />
			`),
		},
		{
			title: "Open a session (HTTP Request)",
			description: dedent(`
				Use an HTTP Request node against this context’s REST root. POST JSON with a scopes array; store the session id from the response for later nodes.

				~~~surrealql
				-- POST ${restRoot}/sessions

				-- Headers:
				--   API-KEY: {{ $env.SPECTRON_API_KEY }}
				--   Content-Type: application/json

				-- Body:
				{
				  "scopes": ["user/{{ $json.userId }}"]
				}
				~~~
			`),
		},
		{
			title: "Record a turn",
			description: dedent(`
				POST user or assistant turns to /sessions/{id}/turns so Spectron can extract memory. Replace the session id with the value from the previous step.

				~~~surrealql
				-- POST ${restRoot}/sessions/<session_id>/turns

				-- Headers:
				--   API-KEY: {{ $env.SPECTRON_API_KEY }}
				--   Content-Type: application/json

				-- Body:
				{
				  "role": "user",
				  "content": "{{ $json.message }}"
				}
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Add a query node to retrieve ranked memory for an incoming message before you call your LLM or downstream tools.

				~~~surrealql
				-- POST ${restRoot}/query

				-- Headers:
				--   API-KEY: {{ $env.SPECTRON_API_KEY }}
				--   Content-Type: application/json

				-- Body:
				{
				  "query": "{{ $json.userQuestion }}",
				  "k": 10
				}
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				Read the REST surface reference for paths, payloads, and error handling.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/surfaces/rest" />
			`),
		},
	];
}
