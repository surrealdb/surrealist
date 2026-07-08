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
				Add Spectron, the LangChain adapter, and your chosen model provider. The adapter does not bundle LangChain—install the stack you already use.

				~~~bash
				pip install spectron spectron-langchain langchain langchain-openai
				~~~
			`),
		},
		{
			title: "Create API credentials",
			description: dedent(`
				SpectronMemory authenticates with an agent API key for this context. Create one here if you have not already.

				<ApiKey />
			`),
		},
		{
			title: "Wire SpectronMemory",
			description: dedent(`
				Point memory at this context’s endpoint and scope. Each save_context call records user and assistant turns; load_memory_variables recalls relevant graph and vector context.

				~~~python
				from langchain_openai import ChatOpenAI
				from langchain.chains import ConversationChain
				from spectron_langchain import SpectronMemory

				memory = SpectronMemory(
				    api_key="your-api-key",
				    endpoint="${endpoint}",
				    scopes=[["user/alex", "org/acme"]],
				)

				chain = ConversationChain(
				    llm=ChatOpenAI(model="gpt-4o"),
				    memory=memory,
				)

				response = chain.invoke({"input": "I'm Alex and I prefer dark mode."})
				print(response["response"])
				~~~
			`),
		},
		{
			title: "Optional: retrieval + memory",
			description: dedent(`
				Combine SpectronMemory with SpectronRetriever so ConversationalRetrievalChain blends experiential memory and authoritative knowledge.

				~~~python
				from langchain.chains import ConversationalRetrievalChain
				from langchain_openai import ChatOpenAI
				from spectron_langchain import SpectronMemory, SpectronRetriever

				llm = ChatOpenAI(model="gpt-4o")
				memory = SpectronMemory(
				    api_key="your-api-key",
				    endpoint="${endpoint}",
				    scopes=[["user/alex", "org/acme"]],
				)
				retriever = SpectronRetriever(
				    api_key="your-api-key",
				    context_id="${context.id}",
				)

				chain = ConversationalRetrievalChain.from_llm(
				    llm=llm,
				    retriever=retriever,
				    memory=memory,
				)
				~~~
			`),
		},
		{
			title: "Explore Spectron",
			description: dedent(`
				Full adapter reference, session lifetime, tool-call capture, and LangChain message mapping.

				<Documentation href="https://surrealdb.com/docs/spectron/integrations/frameworks/langchain" />
			`),
		},
	];
}
