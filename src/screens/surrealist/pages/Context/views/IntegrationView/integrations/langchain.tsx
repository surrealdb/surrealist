import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildLangChainSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install packages",
			description:
				"Add Spectron, the LangChain adapter, and your chosen model provider. The adapter does not bundle LangChain—install the stack you already use.",
			code: "pip install spectron spectron-langchain langchain langchain-openai",
			lang: "bash",
		},
		{
			title: "Create API credentials",
			description:
				"SpectronMemory authenticates with an agent API key for this context. Create one here if you have not already.",
			action: "api_keys",
		},
		{
			title: "Wire SpectronMemory",
			description:
				"Point memory at this context’s endpoint and scope. Each save_context call records user and assistant turns; load_memory_variables recalls relevant graph and vector context.",
			code: `from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain
from spectron_langchain import SpectronMemory

memory = SpectronMemory(
    api_key="your-api-key",
    endpoint="${endpoint}",
    scope={"user": "alex", "org": "acme"},
)

chain = ConversationChain(
    llm=ChatOpenAI(model="gpt-4o"),
    memory=memory,
)

response = chain.invoke({"input": "I'm Alex and I prefer dark mode."})
print(response["response"])`,
			lang: "python",
		},
		{
			title: "Optional: retrieval + memory",
			description:
				"Combine SpectronMemory with SpectronRetriever so ConversationalRetrievalChain blends experiential memory and authoritative knowledge.",
			code: `from langchain.chains import ConversationalRetrievalChain
from langchain_openai import ChatOpenAI
from spectron_langchain import SpectronMemory, SpectronRetriever

llm = ChatOpenAI(model="gpt-4o")
memory = SpectronMemory(
    api_key="your-api-key",
    endpoint="${endpoint}",
    scope={"user": "alex", "org": "acme"},
)
retriever = SpectronRetriever(
    api_key="your-api-key",
    context_id="${context.id}",
)

chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=retriever,
    memory=memory,
)`,
			lang: "python",
		},
		{
			title: "Explore Spectron",
			description:
				"Full adapter reference, session lifetime, tool-call capture, and LangChain message mapping.",
			action: "documentation",
			documentationUrl:
				"https://surrealdb.com/docs/spectron/integrations/frameworks/langchain",
		},
	];
}
