import {
	Anchor,
	Box,
	Button,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Tabs,
	Text,
	Timeline,
} from "@mantine/core";
import {
	CodeBlock,
	Icon,
	iconAPI,
	iconArrowUpRight,
	iconModel,
	iconOpen,
	iconRelation,
	iconSearch,
	iconTrend,
} from "@surrealdb/ui";
import { useState } from "react";
import { useCloudContextStatsQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { ContextViewProps } from "../../types";

const GRID_COLUMNS = { base: 1, sm: 2, lg: 4 };

function StatCard({
	icon,
	label,
	value,
	delta,
}: {
	icon: string;
	label: string;
	value: string | number;
	delta: number;
}) {
	return (
		<Paper p="lg">
			<Group
				gap="md"
				wrap="nowrap"
			>
				<Icon path={icon} />
				<Text inherit>{label}</Text>
			</Group>
			<Group>
				<Text
					fz="h1"
					c="bright"
					fw={700}
				>
					{value}
				</Text>
				<Group
					c={delta > 0 ? "green" : "red"}
					gap="xs"
				>
					<Icon
						path={iconTrend}
						style={{ transform: delta > 0 ? undefined : "scaleY(-1)" }}
					/>
					<Text inherit>{Math.abs(delta)}%</Text>
				</Group>
			</Group>
		</Paper>
	);
}

type IntegrationTab = "python" | "javascript" | "api";

const INTEGRATION_STEPS: Record<
	IntegrationTab,
	{ title: string; description: string; code: string; lang: string }[]
> = {
	python: [
		{
			title: "Install the SDK",
			description: "Get started by installing the SurrealDB Context Python package.",
			code: "pip install surrealdb-context",
			lang: "bash",
		},
		{
			title: "Initialise the client",
			description: "Initialise the client with your API key to start making requests.",
			code: `from surrealdb_context import ContextClient

client = ContextClient(api_key="your-api-key")`,
			lang: "python",
		},
		{
			title: "Add memory",
			description: "Store conversation history and important information for your users.",
			code: `messages = [
    { "role": "user", "content": "Hi, I'm Alex. I prefer dark mode." },
    { "role": "assistant", "content": "Hello Alex! I've noted your preference." }
]

client.add(messages, user_id="alex")`,
			lang: "python",
		},
		{
			title: "Retrieve memory",
			description: "Retrieve the complete memory history for a specific user.",
			code: `query = "What are the user's preferences?"

results = client.search(query, user_id="alex")`,
			lang: "python",
		},
	],
	javascript: [
		{
			title: "Install the SDK",
			description: "Get started by installing the SurrealDB Context npm package.",
			code: "npm install @surrealdb/context",
			lang: "bash",
		},
		{
			title: "Initialise the client",
			description: "Initialise the client with your API key to start making requests.",
			code: `import { ContextClient } from "@surrealdb/context";

const client = new ContextClient({ apiKey: "your-api-key" });`,
			lang: "javascript",
		},
		{
			title: "Add memory",
			description: "Store conversation history and important information for your users.",
			code: `const messages = [
    { role: "user", content: "Hi, I'm Alex. I prefer dark mode." },
    { role: "assistant", content: "Hello Alex! I've noted your preference." }
];

await client.add(messages, { userId: "alex" });`,
			lang: "javascript",
		},
		{
			title: "Retrieve memory",
			description: "Retrieve the complete memory history for a specific user.",
			code: `const results = await client.search(
    "What are the user's preferences?",
    { userId: "alex" }
);`,
			lang: "javascript",
		},
	],
	api: [
		{
			title: "Add memory",
			description: "Store conversation history using the REST API.",
			code: `curl -X POST https://api.surrealdb.com/v1/context/memories \\
    -H "Authorization: Bearer your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{
        "messages": [
            { "role": "user", "content": "Hi, I'm Alex." }
        ],
        "user_id": "alex"
    }'`,
			lang: "bash",
		},
		{
			title: "Search memories",
			description: "Search across stored memories using semantic search.",
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
			title: "List memories",
			description: "Retrieve all stored memories for a specific user.",
			code: `curl https://api.surrealdb.com/v1/context/memories?user_id=alex \\
    -H "Authorization: Bearer your-api-key"`,
			lang: "bash",
		},
	],
};

const TAB_LABELS: Record<IntegrationTab, string> = {
	python: "Python",
	javascript: "JavaScript",
	api: "REST API",
};

export default function DashboardView({ context }: ContextViewProps) {
	const { data: stats } = useCloudContextStatsQuery(context.id);
	const [activeTab, setActiveTab] = useState<IntegrationTab>("python");

	const steps = INTEGRATION_STEPS[activeTab];

	return (
		<>
			<PrimaryTitle fz={32}>{context.name}</PrimaryTitle>

			<Section>
				<SimpleGrid cols={GRID_COLUMNS}>
					<StatCard
						icon={iconModel}
						label="Total memories"
						value={stats?.totalMemories ?? 0}
						delta={stats?.memoriesAddedToday ?? 0}
					/>
					<StatCard
						icon={iconSearch}
						label="Searches today"
						value={stats?.searchesToday ?? 0}
						delta={stats?.searchesToday ?? 0}
					/>
					<StatCard
						icon={iconRelation}
						label="Knowledge nodes"
						value={stats?.totalKnowledgeNodes ?? 0}
						delta={stats?.totalKnowledgeRelations ?? 0}
					/>
					<StatCard
						icon={iconAPI}
						label="Avg latency"
						value={`${stats?.avgSearchLatencyMs ?? 0}ms`}
						delta={-(stats?.avgSearchLatencyMs ?? 0)}
					/>
				</SimpleGrid>
			</Section>

			<Section
				title="Integrate with your stack"
				description="Get started quickly using the SDK or REST API"
				rightSection={
					<Button
						component="a"
						href="https://surrealdb.com/docs/context"
						target="_blank"
						rel="noopener noreferrer"
						variant="subtle"
						size="sm"
						rightSection={
							<Icon
								path={iconOpen}
								size="sm"
							/>
						}
					>
						Documentation
					</Button>
				}
			>
				<Tabs
					value={activeTab}
					onChange={(v) => setActiveTab((v as IntegrationTab) ?? "python")}
					mb="lg"
				>
					<Tabs.List>
						{(Object.keys(TAB_LABELS) as IntegrationTab[]).map((tab) => (
							<Tabs.Tab
								key={tab}
								value={tab}
							>
								{TAB_LABELS[tab]}
							</Tabs.Tab>
						))}
					</Tabs.List>
					<Divider />
				</Tabs>

				<Timeline
					active={steps.length - 1}
					bulletSize={28}
					lineWidth={2}
				>
					{steps.map((step, index) => (
						<Timeline.Item
							key={step.title}
							bullet={<Text fw={700}>{index + 1}</Text>}
							title={step.title}
						>
							<Text mb="xs">{step.description}</Text>
							<CodeBlock
								value={step.code}
								lang={step.lang}
							/>
						</Timeline.Item>
					))}
				</Timeline>

				<Box mt="xl">
					<Group gap="xs">
						For more examples and advanced usage, visit the{" "}
						<Anchor
							href="https://surrealdb.com/docs/context"
							target="_blank"
							rel="noopener noreferrer"
							c="surreal"
						>
							<Group gap="xs">
								full documentation
								<Icon path={iconArrowUpRight} />
							</Group>
						</Anchor>
					</Group>
				</Box>
			</Section>
		</>
	);
}
