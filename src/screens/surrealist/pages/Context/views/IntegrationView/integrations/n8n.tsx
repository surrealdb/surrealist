import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildN8nSteps(context: CloudContext): IntegrationStep[] {
	const { restRoot } = getSpectronUrls(context);

	return [
		{
			title: "Create an API key",
			description:
				"n8n workflows call Spectron over HTTPS with the same API-KEY header as the REST API. Create a key scoped to this context.",
			action: "api_keys",
		},
		{
			title: "Open a session (HTTP Request)",
			description:
				"Use an HTTP Request node against this context’s REST root. POST JSON with a scopes array; store the session id from the response for later nodes.",
			code: `POST ${restRoot}/sessions
Headers:
  API-KEY: {{ $env.SPECTRON_API_KEY }}
  Content-Type: application/json
Body:
{
  "scopes": ["user/{{ $json.userId }}"]
}`,
			lang: "text",
		},
		{
			title: "Record a turn",
			description:
				"POST user or assistant turns to /sessions/{id}/turns so Spectron can extract memory. Replace the session id with the value from the previous step.",
			code: `POST ${restRoot}/sessions/<session_id>/turns
Headers:
  API-KEY: {{ $env.SPECTRON_API_KEY }}
  Content-Type: application/json
Body:
{
  "role": "user",
  "content": "{{ $json.message }}"
}`,
			lang: "text",
		},
		{
			title: "Recall with hybrid search",
			description:
				"Add a query node to retrieve ranked memory for an incoming message before you call your LLM or downstream tools.",
			code: `POST ${restRoot}/query
Headers:
  API-KEY: {{ $env.SPECTRON_API_KEY }}
  Content-Type: application/json
Body:
{
  "query": "{{ $json.userQuestion }}",
  "k": 10
}`,
			lang: "text",
		},
		{
			title: "Explore Spectron",
			description: "Read the REST surface reference for paths, payloads, and error handling.",
			action: "documentation",
			documentationUrl: "https://surrealdb.com/docs/spectron/integrations/surfaces/rest",
		},
	];
}
