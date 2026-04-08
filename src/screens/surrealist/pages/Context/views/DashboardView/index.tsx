import { Sparkline } from "@mantine/charts";
import {
	Anchor,
	Box,
	Button,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Tabs,
	Text,
	ThemeIcon,
} from "@mantine/core";
import {
	CodeBlock,
	Icon,
	iconAPI,
	iconModel,
	iconOpen,
	iconRelation,
	iconSearch,
} from "@surrealdb/ui";
import { useState } from "react";
import { useCloudContextStatsQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { ContextViewProps } from "../../types";

const GRID_COLUMNS = { base: 1, sm: 2, lg: 4 };

const MOCK_MEMORY_TREND = [3, 5, 8, 6, 12, 9, 14, 11, 18, 15, 20, 18];
const MOCK_SEARCH_TREND = [12, 18, 24, 15, 30, 22, 35, 28, 40, 47, 42, 47];
const MOCK_KNOWLEDGE_TREND = [2, 3, 4, 5, 6, 7, 8, 8, 9, 10, 11, 12];
const MOCK_LATENCY_TREND = [65, 58, 52, 48, 55, 44, 50, 46, 43, 42, 45, 42];

function StatCard({
	icon,
	label,
	value,
	subtitle,
	color,
	trendData,
}: {
	icon: string;
	label: string;
	value: string | number;
	subtitle?: string;
	color: string;
	trendData: number[];
}) {
	return (
		<Paper p="lg">
			<Group
				gap="md"
				wrap="nowrap"
				justify="space-between"
			>
				<Group
					gap="md"
					wrap="nowrap"
				>
					<ThemeIcon
						color={color}
						variant="light"
						size="xl"
					>
						<Icon
							size="lg"
							path={icon}
						/>
					</ThemeIcon>
					<Stack gap={2}>
						<Text
							fw={700}
							fz="xl"
							c="bright"
						>
							{value}
						</Text>
						<Text>{label}</Text>
					</Stack>
				</Group>
				<Sparkline
					w={80}
					h={32}
					data={trendData}
					curveType="natural"
					color={`var(--mantine-color-${color}-6)`}
					strokeWidth={2}
					fillOpacity={0.15}
				/>
			</Group>
			{subtitle && <Text mt="xs">{subtitle}</Text>}
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
						subtitle={`${stats?.memoriesAddedToday ?? 0} added today`}
						color="blue"
						trendData={MOCK_MEMORY_TREND}
					/>
					<StatCard
						icon={iconSearch}
						label="Searches today"
						value={stats?.searchesToday ?? 0}
						subtitle={`${stats?.memoriesAddedThisWeek ?? 0} this week`}
						color="violet"
						trendData={MOCK_SEARCH_TREND}
					/>
					<StatCard
						icon={iconRelation}
						label="Knowledge nodes"
						value={stats?.totalKnowledgeNodes ?? 0}
						subtitle={`${stats?.totalKnowledgeRelations ?? 0} relations`}
						color="teal"
						trendData={MOCK_KNOWLEDGE_TREND}
					/>
					<StatCard
						icon={iconAPI}
						label="Avg latency"
						value={`${stats?.avgSearchLatencyMs ?? 0}ms`}
						subtitle={`${stats?.totalUsers ?? 0} users, ${stats?.totalAgents ?? 0} agents`}
						color="orange"
						trendData={MOCK_LATENCY_TREND}
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
				>
					<Tabs.List mb="lg">
						{(Object.keys(TAB_LABELS) as IntegrationTab[]).map((tab) => (
							<Tabs.Tab
								key={tab}
								value={tab}
							>
								{TAB_LABELS[tab]}
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs>

				<SimpleGrid cols={{ base: 1, md: 2 }}>
					<Stack gap="xl">
						{steps.map((step, index) => (
							<Group
								key={step.title}
								gap="md"
								wrap="nowrap"
								align="flex-start"
							>
								<ThemeIcon
									size="lg"
									radius="xl"
									variant="light"
									color="surreal"
									mt={2}
								>
									<Text fw={700}>{index + 1}</Text>
								</ThemeIcon>
								<Box>
									<Text
										fw={600}
										c="bright"
										mb={4}
									>
										{step.title}
									</Text>
									<Text>{step.description}</Text>
								</Box>
							</Group>
						))}
					</Stack>

					<Stack gap="md">
						{steps.map((step) => (
							<CodeBlock
								key={step.title}
								value={step.code}
								lang={step.lang}
							/>
						))}
					</Stack>
				</SimpleGrid>

				<Box mt="xl">
					<Text>
						For more examples and advanced usage, visit the{" "}
						<Anchor
							href="https://surrealdb.com/docs/context"
							target="_blank"
							rel="noopener noreferrer"
							c="surreal"
						>
							full documentation
						</Anchor>
						.
					</Text>
				</Box>
			</Section>
		</>
	);
}
