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
} from "@mantine/core";
import {
	brandJavaScript,
	brandPython,
	CodeBlock,
	Icon,
	iconAPI,
	iconArrowUpRight,
	iconCheckCircle,
	iconOpen,
} from "@surrealdb/ui";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useContextNavigator } from "~/hooks/routing";
import type { ContextViewPage } from "~/types";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

type IntegrationTab = "python" | "javascript" | "api";

interface IntegrationStep {
	title: string;
	description: string;
	code: string;
	lang: string;
}

const INTEGRATION_STEPS: Record<IntegrationTab, IntegrationStep[]> = {
	python: [
		{
			title: "Install the SDK",
			description: "Add the Python package to your project.",
			code: "pip install surrealdb-context",
			lang: "bash",
		},
		{
			title: "Initialise the client",
			description: "Authenticate with an API key to reach your context.",
			code: `from surrealdb_context import ContextClient

client = ContextClient(api_key="your-api-key")`,
			lang: "python",
		},
		{
			title: "Ingest a memory",
			description: "Store a turn that the agent should remember.",
			code: `messages = [
    {"role": "user", "content": "Hi, I'm Alex. I prefer dark mode."},
    {"role": "assistant", "content": "Got it, Alex - noted."},
]

client.add(messages, user_id="alex")`,
			lang: "python",
		},
		{
			title: "Retrieve with hybrid search",
			description: "Combine graph, vector, and structured filters in one call.",
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
			description: "Authenticate with an API key to reach your context.",
			code: `import { ContextClient } from "@surrealdb/context";

const client = new ContextClient({ apiKey: "your-api-key" });`,
			lang: "javascript",
		},
		{
			title: "Ingest a memory",
			description: "Store a turn that the agent should remember.",
			code: `const messages = [
    { role: "user", content: "Hi, I'm Alex. I prefer dark mode." },
    { role: "assistant", content: "Got it, Alex - noted." },
];

await client.add(messages, { userId: "alex" });`,
			lang: "javascript",
		},
		{
			title: "Retrieve with hybrid search",
			description: "Combine graph, vector, and structured filters in one call.",
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
			description: "POST a conversation turn to the memories endpoint.",
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
			description: "Run hybrid retrieval using a natural-language query.",
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
			description: "Fetch everything attributed to a specific user.",
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
				<Box>
					<Text
						fz="xs"
						fw={600}
						c="violet.4"
						tt="uppercase"
						style={{ letterSpacing: "0.08em" }}
					>
						Quick start
					</Text>
					<PrimaryTitle
						fz={22}
						mt={4}
					>
						Connect an agent in four steps
					</PrimaryTitle>
				</Box>
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
						variant="light"
						color="violet"
						size="sm"
						onClick={() => goToPage("api-keys")}
						rightSection={<Icon path={iconArrowUpRight} />}
					>
						Get API key
					</Button>
				</Group>
			</Group>

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
				<Divider mt="sm" />
			</Tabs>

			<SimpleGrid
				cols={{ base: 1, md: 2 }}
				spacing="xl"
				mt="lg"
			>
				<Stack gap="lg">
					{steps.map((step, idx) => (
						<Box
							key={step.title}
							className={classes.stepRow}
						>
							<Box
								className={classes.stepBullet}
								aria-hidden
							>
								{idx + 1}
							</Box>
							<Text
								fw={600}
								c="bright"
								fz="md"
							>
								{step.title}
							</Text>
							<Text
								fz="sm"
								mt={4}
								lh={1.55}
								className="selectable"
							>
								{step.description}
							</Text>
						</Box>
					))}
					<Group
						gap="sm"
						mt="xs"
					>
						<Icon
							path={iconCheckCircle}
							c="violet.4"
							size="sm"
						/>
						<Text
							fz="sm"
							className="selectable"
						>
							Your agent now has persistent, queryable memory.
						</Text>
					</Group>
				</Stack>
				<Stack gap="sm">
					{steps.map((step) => (
						<CodeBlock
							key={step.title}
							value={step.code}
							lang={step.lang}
						/>
					))}
				</Stack>
			</SimpleGrid>
		</Paper>
	);
}
