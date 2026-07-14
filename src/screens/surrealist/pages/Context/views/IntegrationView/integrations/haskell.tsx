import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildHaskellSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Add the dependency",
			description: dedent(`
				The Spectron client ships as the \`surrealdb-spectron\` package alongside the SurrealDB Haskell driver. Add it to your \`cabal.project\`.

				~~~
				source-repository-package
				  type: git
				  location: https://github.com/surrealdb/surrealdb.haskell
				  subdir: surrealdb surrealdb-spectron
				~~~

				Then add \`surrealdb-spectron\` to your component's \`build-depends\`.
			`),
		},
		{
			title: "Initialise the client",
			description: dedent(`
				Create a client for this context. The endpoint and context id are pre-filled from your selection.

				~~~haskell
				import Spectron

				main :: IO ()
				main = do
				    client <- newSpectron
				        (defaultSpectronOptions
				            "${context.id}"
				            "your-api-key"
				            "${endpoint}")
				~~~

				<ApiKey />
			`),
		},
		{
			title: "Capture a memory",
			description: dedent(`
				Record a fact. Spectron pulls out entities, attributes, and relations server-side, so the memory graph fills in on its own.

				~~~haskell
				_ <- remember client "Hi, I'm Alex. I prefer dark mode." defaultRememberOptions
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Run one query that blends graph traversal, vector similarity, and structured filters, then get the most relevant memories back in a single call.

				~~~haskell
				answer <- recall client "What are the user's preferences?" defaultRecallOptions
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
