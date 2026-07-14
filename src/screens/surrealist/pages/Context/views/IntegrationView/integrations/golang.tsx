import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildGolangSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the SDK",
			description: dedent(`
				Pull the Spectron client, bundled with the official surrealdb.go module.

				~~~bash
				go get github.com/surrealdb/surrealdb.go/spectron
				~~~
			`),
		},
		{
			title: "Initialise the client",
			description: dedent(`
				Create a client pinned to this context. It takes the context id, endpoint, and API key (sent as a Bearer token); the endpoint and context id are pre-filled from your selection.

				~~~go
				import "github.com/surrealdb/surrealdb.go/spectron"

				client, err := spectron.New(
				    "${context.id}",   // context id
				    "${endpoint}",     // endpoint
				    "your-api-key",    // api key
				)
				if err != nil {
				    return err
				}
				defer client.Close()
				~~~

				<ApiKey />
			`),
		},
		{
			title: "Capture a memory",
			description: dedent(`
				Record a fact. Spectron pulls out entities, attributes, and relations server-side, so the memory graph fills in on its own.

				~~~go
				ctx := context.Background()

				_, err := client.Remember(ctx, &spectron.RememberRequest{
				    Text: "Hi, I'm Alex. I prefer dark mode.",
				})
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Run one query that blends graph traversal, vector similarity, and structured filters, then get the most relevant memories back in a single call.

				~~~go
				hits, err := client.Recall(ctx, &spectron.RecallRequest{
				    Query: "What are the user's preferences?",
				})

				for _, h := range hits.Hits {
				    fmt.Println(h.Score, h.Source, h.Text)
				}
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
