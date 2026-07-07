import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildCliSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install the CLI",
			description:
				"Download and install the Spectron CLI with a single command. It drops the `spectron` binary onto your PATH.",
			code: "curl -fsSL https://download.surrealdb.com/spectron/install.sh | sh",
			lang: "bash",
		},
		{
			title: "Create an API key",
			description:
				"The CLI authenticates with an API key scoped to this context. Create one here if you have not already.",
			action: "api_keys",
		},
		{
			title: "Connect to your context",
			description:
				"Stash the endpoint, API key, and context id under a named profile so every command reads them automatically. The endpoint and context id are pre-filled from your selection.",
			code: `spectron login \\
    --url "${endpoint}" \\
    --api-key "your-api-key" \\
    --context-id "${context.id}"`,
			lang: "bash",
		},
		{
			title: "Capture a memory",
			description:
				"Remember a piece of text. Spectron extracts entities, attributes, and relations so the memory graph grows automatically.",
			code: `spectron remember "Hi, I'm Alex. I prefer dark mode."`,
			lang: "bash",
		},
		{
			title: "Recall with hybrid search",
			description:
				"Query your stored memories and let the hybrid retrieval pipeline blend graph traversal, vector similarity, and structured filters behind a single command.",
			code: `spectron recall "What are the user's preferences?" --limit 10`,
			lang: "bash",
		},
		{
			title: "Explore interactively",
			description:
				"Launch the REPL for a line-oriented shell, or the TUI for a multi-pane workbench that visualises the memory graph, traces, and supersession live.",
			code: `spectron repl\nspectron tui`,
			lang: "bash",
		},
		{
			title: "Explore Spectron",
			description:
				"Full command reference — remember, recall, context, reflect, consolidate, and the interactive terminal surfaces.",
			action: "documentation",
			documentationUrl: "https://surrealdb.com/docs/spectron/integrations/cli",
		},
	];
}
