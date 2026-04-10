import {
	Box,
	Button,
	Divider,
	Image,
	SimpleGrid,
	Tabs,
	Text,
	ThemeIcon,
	Timeline,
} from "@mantine/core";
import {
	brandJavaScript,
	brandPython,
	CodeBlock,
	Icon,
	iconAPI,
	iconArrowUpRight,
	iconOpen,
} from "@surrealdb/ui";
import { type ReactNode, useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import type { ContextViewProps } from "../../types";

type IntegrationTab = "python" | "javascript" | "api";

const INTEGRATION_STEPS: Record<
	IntegrationTab,
	{ title: string; description: string; code?: string; lang?: string; content?: ReactNode }[]
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
		{
			title: "Learn more",
			description: "For more examples and advanced usage, visit the full documentation.",
			content: (
				<Button
					component="a"
					href="https://surrealdb.com/docs/context"
					target="_blank"
					rel="noopener noreferrer"
					mt="lg"
					rightSection={<Icon path={iconArrowUpRight} />}
				>
					Full documentation
				</Button>
			),
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
		{
			title: "Learn more",
			description: "For more examples and advanced usage, visit the full documentation.",
			content: (
				<Button
					component="a"
					href="https://surrealdb.com/docs/context"
					target="_blank"
					rel="noopener noreferrer"
					mt="lg"
					rightSection={<Icon path={iconArrowUpRight} />}
				>
					Full documentation
				</Button>
			),
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
		{
			title: "Learn more",
			description: "For more examples and advanced usage, visit the full documentation.",
			content: (
				<Button
					component="a"
					href="https://surrealdb.com/docs/context"
					target="_blank"
					rel="noopener noreferrer"
					mt="lg"
					rightSection={<Icon path={iconArrowUpRight} />}
				>
					Full documentation
				</Button>
			),
		},
	],
};

const LANGUAGES: Record<IntegrationTab, { label: string; img?: string; icon?: string }> = {
	python: { label: "Python", img: brandPython },
	javascript: { label: "JavaScript", img: brandJavaScript },
	api: { label: "REST API", icon: iconAPI },
};

export default function DashboardView({ context }: ContextViewProps) {
	const [activeTab, setActiveTab] = useState<IntegrationTab>("python");

	const steps = INTEGRATION_STEPS[activeTab];

	return (
		<>
			<PrimaryTitle fz={32}>{context.name}</PrimaryTitle>

			<Section
				title="Integrate with your stack"
				description="Get started quickly using the SDK or REST API"
				withPaper
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
						{(Object.keys(LANGUAGES) as IntegrationTab[]).map((tab) => (
							<Tabs.Tab
								key={tab}
								value={tab}
								leftSection={
									LANGUAGES[tab].img ? (
										<Image
											src={LANGUAGES[tab].img}
											w={16}
											mr="xs"
										/>
									) : LANGUAGES[tab].icon ? (
										<Icon
											path={LANGUAGES[tab].icon}
											c="bright"
											size="lg"
											mr="xs"
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
					active={steps.length - 1}
					bulletSize={24}
					lineWidth={2}
					styles={{
						itemTitle: {
							color: "var(--mantine-color-bright)",
							fontSize: "var(--mantine-font-size-lg)",
						},
					}}
				>
					{steps.map((step, index) => (
						<Timeline.Item
							key={step.title}
							bullet={
								<ThemeIcon
									size={24}
									color="violet"
									variant="filled"
									radius="xl"
								>
									<Text
										inherit
										fz="xs"
									>
										{index + 1}
									</Text>
								</ThemeIcon>
							}
							title={step.title}
						>
							<SimpleGrid cols={2}>
								<Box>
									<Text mt="xs">{step.description}</Text>
									{step.content}
								</Box>
								{step.code && (
									<CodeBlock
										value={step.code}
										lang={step.lang}
									/>
								)}
							</SimpleGrid>
						</Timeline.Item>
					))}
				</Timeline>
			</Section>
		</>
	);
}
