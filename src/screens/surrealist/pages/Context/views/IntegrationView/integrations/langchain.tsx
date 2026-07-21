import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { getSpectronUrls } from "../helpers/spectron-urls";
import type { IntegrationStep } from "./types";

export function buildLangChainSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install packages",
			description: dedent(`
				The official SurrealDB integration for the LangChain.js and LangGraph.js ecosystems wraps the \`@surrealdb/spectron\` client. Requires Node.js ≥ 22 or Bun ≥ 1.

				~~~bash
				bun add @surrealdb/langchain @surrealdb/langgraph @surrealdb/spectron
				~~~
			`),
		},
		{
			title: "Create an API key",
			description: dedent(`
				The adapter authenticates with a scoped API key bound to your principal. Create one for this context.

				<ApiKey />
			`),
		},
		{
			title: "Configure the client",
			description: dedent(`
				Construct a Spectron client for this context. The endpoint and context id are pre-filled from your selection.

				~~~typescript
				import { Spectron } from "@surrealdb/langchain-core";

				const spectron = new Spectron({
				    context: "${context.id}",
				    endpoint: "${endpoint}",
				    apiKey: "your-api-key",
				});
				~~~

				Or call \`resolveSpectron({})\` to build the client from the \`SPECTRON_ENDPOINT\`, \`SPECTRON_API_KEY\`, and \`SPECTRON_CONTEXT\` environment variables.
			`),
		},
		{
			title: "Retrieve and add tools",
			description: dedent(`
				\`SpectronRetriever\` turns memory hits into LangChain \`Document\`s, and \`SpectronQueryTool\` / \`SpectronReflectTool\` wire Spectron into your agents.

				~~~typescript
				import { SpectronRetriever } from "@surrealdb/langchain/retrievers";
				import { SpectronQueryTool, SpectronReflectTool } from "@surrealdb/langchain/tools";

				const retriever = new SpectronRetriever({
				    client: spectron,
				    mode: "hybrid_graph",
				    k: 8,
				});

				const docs = await retriever.invoke("what is the return policy?");

				const tools = [
				    new SpectronQueryTool({ client: spectron }),
				    new SpectronReflectTool({ client: spectron }),
				];
				~~~
			`),
		},
		{
			title: "Persist state with LangGraph",
			description: dedent(`
				Add \`@surrealdb/langgraph\` for a \`SpectronStore\` that reads entities and recall through Spectron from your LangGraph nodes.

				~~~typescript
				import { SpectronStore } from "@surrealdb/langgraph/spectron_store";

				const store = new SpectronStore({ spectron });
				await store.get(["Person"], "alex");
				await store.search(["Person"], { query: "who is alex?", limit: 5 });
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
