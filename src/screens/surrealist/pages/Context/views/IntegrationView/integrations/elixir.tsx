import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildElixirSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Add the dependency",
			description: dedent(`
				The Spectron client ships inside the \`surrealdb\` Hex package. Add it to your \`mix.exs\` and run \`mix deps.get\`.

				~~~elixir
				def deps do
				  [
				    {:surrealdb, "~> 0.1"}
				  ]
				end
				~~~
			`),
		},
		{
			title: "Initialise the client",
			description: dedent(`
				Create a client for this context. The endpoint and context id are pre-filled from your selection.

				~~~elixir
				client =
				  SurrealDB.Spectron.new(
				    context: "${context.id}",
				    endpoint: "${endpoint}",
				    api_key: "your-api-key"
				  )
				~~~

				<ApiKey />
			`),
		},
		{
			title: "Capture a memory",
			description: dedent(`
				Record a fact. Spectron extracts entities, attributes, and relations server-side so the memory graph grows automatically.

				~~~elixir
				{:ok, _} =
				  SurrealDB.Spectron.remember(client, "Hi, I'm Alex. I prefer dark mode.", scopes: "user/alex")
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.

				~~~elixir
				{:ok, hits} =
				  SurrealDB.Spectron.recall(client, "What are the user's preferences?", k: 10)
				~~~
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
