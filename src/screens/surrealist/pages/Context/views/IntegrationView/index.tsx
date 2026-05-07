import {
	Box,
	Button,
	Divider,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	Timeline,
	Title,
} from "@mantine/core";
import {
	brandJavaScript,
	brandPython,
	CodeBlock,
	Header,
	Icon,
	iconAPI,
	iconArrowUpRight,
	iconOpen,
} from "@surrealdb/ui";
import { useState } from "react";
import { useContextNavigator } from "~/hooks/routing";
import type { ContextViewPage } from "~/types";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

type IntegrationTab = "python" | "javascript" | "api";

interface IntegrationStep {
	title: string;
	description: string;
	code?: string;
	lang?: string;
}

const INTEGRATION_STEPS: Record<IntegrationTab, IntegrationStep[]> = {
	python: [
		{
			title: "Install the SDK",
			description: "Pull the official Python package into your environment.",
			code: "pip install surrealdb-context",
			lang: "bash",
		},
		{
			title: "Initialise the client",
			description:
				"Create a client instance with your API key so every subsequent call is authenticated and routed to the correct context workspace for your organisation.",
			code: `from surrealdb_context import ContextClient

client = ContextClient(api_key="your-api-key")`,
			lang: "python",
		},
		{
			title: "Ingest a memory",
			description:
				"Store a conversation turn so the agent can recall it later, attributing each memory to a specific user so retrieval stays scoped and personalised.",
			code: `messages = [
    {"role": "user", "content": "Hi, I'm Alex. I prefer dark mode."},
    {"role": "assistant", "content": "Got it, Alex - noted."},
]

client.add(messages, user_id="alex")`,
			lang: "python",
		},
		{
			title: "Retrieve with hybrid search",
			description:
				"Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.",
			code: `results = client.search(
    "What are the user's preferences?",
    user_id="alex",
)`,
			lang: "python",
		},
	],
	javascript: [
		{
			title: "Install the SDK",
			description: "Add the npm package to your project.",
			code: "npm install @surrealdb/context",
			lang: "bash",
		},
		{
			title: "Initialise the client",
			description:
				"Create a client instance with your API key so every subsequent call is authenticated and routed to the correct context workspace for your organisation.",
			code: `import { ContextClient } from "@surrealdb/context";

const client = new ContextClient({ apiKey: "your-api-key" });`,
			lang: "javascript",
		},
		{
			title: "Ingest a memory",
			description:
				"Store a conversation turn so the agent can recall it later, attributing each memory to a specific user so retrieval stays scoped and personalised.",
			code: `const messages = [
    { role: "user", content: "Hi, I'm Alex. I prefer dark mode." },
    { role: "assistant", content: "Got it, Alex - noted." },
];

await client.add(messages, { userId: "alex" });`,
			lang: "javascript",
		},
		{
			title: "Retrieve with hybrid search",
			description:
				"Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.",
			code: `const results = await client.search(
    "What are the user's preferences?",
    { userId: "alex" },
);`,
			lang: "javascript",
		},
	],
	api: [
		{
			title: "Ingest a memory",
			description:
				"Send a POST request to the memories endpoint with the conversation turn and a user identifier, and the platform will embed, index, and link it to existing context automatically.",
			code: `curl -X POST https://api.surrealdb.com/v1/context/memories \\
    -H "Authorization: Bearer your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{
        "messages": [{"role": "user", "content": "Hi, I'm Alex."}],
        "user_id": "alex"
    }'`,
			lang: "bash",
		},
		{
			title: "Search across memory",
			description:
				"Issue a natural-language query against your stored memories and let the hybrid retrieval pipeline combine vector similarity with graph traversal behind a single endpoint.",
			code: `curl -X POST https://api.surrealdb.com/v1/context/search \\
    -H "Authorization: Bearer your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{
        "query": "What are the user preferences?",
        "user_id": "alex"
    }'`,
			lang: "bash",
		},
		{
			title: "List stored memories",
			description:
				"Fetch every memory attributed to a specific user, useful for auditing what the agent currently knows, exporting their context, or surfacing it inside an admin interface.",
			code: `curl https://api.surrealdb.com/v1/context/memories?user_id=alex \\
    -H "Authorization: Bearer your-api-key"`,
			lang: "bash",
		},
	],
};

const LANGUAGES: Record<IntegrationTab, { label: string; img?: string; icon?: string }> = {
	python: { label: "Python", img: brandPython },
	javascript: { label: "JavaScript", img: brandJavaScript },
	api: { label: "REST API", icon: iconAPI },
};

export default function IntegrationView({ context }: ContextViewProps) {
	const [activeTab, setActiveTab] = useState<IntegrationTab>("python");
	const navigateContext = useContextNavigator();
	const steps = INTEGRATION_STEPS[activeTab];

	const goToPage = (page: ContextViewPage) => {
		navigateContext(context.organization_id, context.id, page);
	};

	return (
		<Paper
			p="lg"
			radius="md"
			className={classes.integrationPane}
		>
			<Group
				justify="space-between"
				align="flex-end"
				wrap="wrap"
				mb="md"
				gap="md"
			>
				<Header
					kicker="Quick start"
					order={2}
				>
					Connect an agent in four steps
				</Header>
				<Group gap="xs">
					<Button
						component="a"
						href="https://surrealdb.com/docs/spectron"
						target="_blank"
						rel="noopener noreferrer"
						variant="subtle"
						size="sm"
						color="slate"
						rightSection={<Icon path={iconOpen} />}
					>
						Documentation
					</Button>
					<Button
						size="sm"
						onClick={() => goToPage("api-keys")}
						rightSection={<Icon path={iconArrowUpRight} />}
					>
						Get API key
					</Button>
				</Group>
			</Group>

			<Stack
				gap="lg"
				mt="lg"
			>
				<Tabs
					value={activeTab}
					onChange={(v) => setActiveTab((v as IntegrationTab) ?? "python")}
				>
					<Tabs.List>
						{(Object.keys(LANGUAGES) as IntegrationTab[]).map((tab) => (
							<Tabs.Tab
								key={tab}
								value={tab}
								leftSection={
									LANGUAGES[tab].img ? (
										<Image
											src={LANGUAGES[tab].img}
											w={14}
											alt=""
										/>
									) : LANGUAGES[tab].icon ? (
										<Icon
											path={LANGUAGES[tab].icon}
											c="bright"
											size="sm"
										/>
									) : undefined
								}
							>
								{LANGUAGES[tab].label}
							</Tabs.Tab>
						))}
					</Tabs.List>
					<Divider />
				</Tabs>

				<Timeline
					mt="md"
					bulletSize={24}
					lineWidth={2}
					styles={{
						itemTitle: {
							color: "var(--mantine-color-bright)",
							fontWeight: 600,
							fontSize: "14px",
						},
						itemBullet: {
							backgroundColor: "var(--mantine-color-obsidian-filled)",
							color: "var(--mantine-color-white)",
							border: "none",
						},
						item: {
							"--item-border-color": "var(--mantine-color-obsidian-7)",
						},
					}}
				>
					{steps.map((step, idx) => (
						<Timeline.Item
							key={idx}
							bullet={idx + 1}
						>
							<SimpleGrid cols={2}>
								<Box>
									<Title
										order={3}
										fz="lg"
									>
										{step.title}
									</Title>
									<Text>{step.description}</Text>
								</Box>
								<CodeBlock
									value={step.code ?? ""}
									lang={step.lang}
								/>
							</SimpleGrid>
						</Timeline.Item>
					))}
				</Timeline>
			</Stack>
		</Paper>
	);
}
