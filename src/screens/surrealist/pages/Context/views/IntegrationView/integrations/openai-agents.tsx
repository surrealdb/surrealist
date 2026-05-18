import type { CloudContext } from "~/types";
import { getSpectronUrls } from "./spectron-urls";
import type { IntegrationStep } from "./types";

export function buildOpenAiAgentsSteps(context: CloudContext): IntegrationStep[] {
	const { endpoint } = getSpectronUrls(context);

	return [
		{
			title: "Install dependencies",
			description:
				"Use the OpenAI Agents SDK for the run loop and the Spectron Python client for durable memory on this context.",
			code: "pip install openai-agents spectron",
			lang: "bash",
		},
		{
			title: "Configure credentials",
			description:
				"Export OPENAI_API_KEY for the Agents SDK and create a Spectron API key for this context. The example below reads both from the environment.",
			action: "api_keys",
		},
		{
			title: "Retrieve memory before each run",
			description:
				"Use Spectron’s context call to fetch ranked memory, inject it into the agent instructions, then run the agent on the user message.",
			code: `import os
import asyncio
from agents import Agent, Runner
from spectron import Spectron

memory = Spectron(
    context="${context.id}",
    base_url="${endpoint}",
    api_key=os.environ["SPECTRON_API_KEY"],
)

async def main() -> None:
    session = await memory.sessions.create(scope={"user": "alex"})
    ctx = await memory.context(
        query="What should the assistant know about this user?",
        k=10,
        scope=session.scope,
    )
    agent = Agent(
        name="Assistant",
        instructions=f"You are a helpful assistant.\\n\\n## Memory\\n{ctx.context}",
    )
    user_message = "What are my UI preferences?"
    result = await Runner.run(agent, user_message)
    await session.turns.add(role="user", content=user_message)
    await session.turns.add(role="assistant", content=result.final_output)
    await session.close()

asyncio.run(main())`,
			lang: "python",
		},
		{
			title: "Explore Spectron",
			description:
				"See session lifecycle, chat loops, and the Python SDK patterns that pair cleanly with external agent frameworks.",
			action: "documentation",
			documentationUrl: "https://surrealdb.com/docs/spectron/integrations/sdks/python",
		},
	];
}
