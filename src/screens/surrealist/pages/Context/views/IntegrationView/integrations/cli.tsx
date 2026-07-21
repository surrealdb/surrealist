import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildCliSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the CLI",
			description: dedent(`
				Download and install the Spectron CLI with a single command. It drops the \`spectron\` binary onto your PATH.

				~~~bash
				curl -fsSL https://download.surrealdb.com/spectron/install.sh | sh
				~~~
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The CLI authenticates with an API key scoped to this context. Create one here if you have not already.

				<ApiKey />
			`),
		},
		{
			title: "Connect to your context",
			description: dedent(`
				Stash the endpoint, API key, and context id under a named profile so every command reads them automatically. The endpoint and context id are pre-filled from your selection.

				~~~bash
				spectron login \\
				    --url "${endpoint}" \\
				    --api-key "your-api-key" \\
				    --context-id "${context.id}"
				~~~
			`),
		},
		{
			title: "Capture a memory",
			description: dedent(`
				Remember a piece of text. Spectron pulls out entities, attributes, and relations, so the memory graph fills in on its own.

				~~~bash
				spectron remember "Hi, I'm Alex. I prefer dark mode."
				~~~
			`),
		},
		{
			title: "Recall with hybrid search",
			description: dedent(`
				Query your stored memories. The hybrid retrieval pipeline blends graph traversal, vector similarity, and structured filters behind one command.

				~~~bash
				spectron recall "What are the user's preferences?" --limit 10
				~~~
			`),
		},
		{
			title: "Explore interactively",
			description: dedent(`
				Launch the REPL for a line-oriented shell, or the TUI for a multi-pane workbench that visualises the memory graph, traces, and supersession live.

				~~~bash
				spectron repl
				spectron tui
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				Full command reference: remember, recall, context, reflect, consolidate, and the interactive terminal surfaces.

				<Documentation />
			`),
		},
	];
}
