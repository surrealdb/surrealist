import {
	Box,
	Button,
	Divider,
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
} from "@surrealdb/ui";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { adapter } from "~/adapter";
import { useContextNavigator, useSearchParams } from "~/hooks/routing";
import type { CloudContext, ContextViewPage } from "~/types";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

type IntegrationTab = "python" | "javascript" | "api";

interface IntegrationStep {
	title: ReactNode;
	description: ReactNode;
	action?: "api_keys" | "documentation";
	code?: string;
	lang?: string;
}

function buildIntegrationSteps(context: CloudContext): Record<IntegrationTab, IntegrationStep[]> {
	const endpoint = `https://${context.host}`;
	const restRoot = `${endpoint}/api/v1/${context.id}`;

	return {
		python: [
			{
				title: "Install the SDK",
				description: "Pull the official Python package into your environment.",
				code: "pip install surrealdb",
				lang: "bash",
			},
			{
				title: "Initialise the client",
				description:
					"Create a Spectron client pointing at this context. The endpoint and context id are pre-filled from your selection.",
				code: `from surrealdb import Spectron

client = Spectron(
    context="${context.id}",
    endpoint="${endpoint}",
    api_key="your-api-key",
)`,
				lang: "python",
				action: "api_keys",
			},
			{
				title: "Capture a memory",
				description:
					"Open a session scoped to a user and record conversation turns. Spectron extracts entities, attributes, and relations on every turn so the memory graph grows automatically.",
				code: `from surrealdb import SpectronTurnRole

session = client.sessions.create(scope={"user": "alex"})
session.turn(SpectronTurnRole.USER, "Hi, I'm Alex. I prefer dark mode.")
session.turn(SpectronTurnRole.ASSISTANT, "Got it, Alex — noted.")`,
				lang: "python",
			},
			{
				title: "Recall with hybrid search",
				description:
					"Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.",
				code: `results = client.query("What are the user's preferences?", k=10)

for hit in results.hits:
    print(hit.score, hit.text)`,
				lang: "python",
			},
			{
				title: "Explore Spectron",
				description:
					"Discover the full potential of Spectron with the official documentation.",
				action: "documentation",
			},
		],
		javascript: [
			{
				title: "Install the SDK",
				description: "Add the Spectron npm package to your project.",
				code: "npm install @surrealdb/spectron",
				lang: "bash",
			},
			{
				title: "Initialise the client",
				description:
					"Create a Spectron client pointing at this context. The base URL and context id are pre-filled from your selection.",
				code: `import { Spectron } from "@surrealdb/spectron";

const client = new Spectron({
    context: "${context.id}",
    endpoint: "${endpoint}",
    apiKey: "your-api-key",
});`,
				lang: "javascript",
				action: "api_keys",
			},
			{
				title: "Capture a memory",
				description:
					"Open a session scoped to a user and record conversation turns. Spectron extracts entities, attributes, and relations on every turn so the memory graph grows automatically.",
				code: `import { TurnRole } from "@surrealdb/spectron";

const session = await client.sessions.create({
    scope: { user: "alex" },
});

await session.turn({ role: TurnRole.user, content: "Hi, I'm Alex. I prefer dark mode." });
await session.turn({ role: TurnRole.assistant, content: "Got it, Alex — noted." });`,
				lang: "javascript",
			},
			{
				title: "Recall with hybrid search",
				description:
					"Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.",
				code: `const results = await client.query({
    query: "What are the user's preferences?",
    k: 10,
});`,
				lang: "javascript",
			},
			{
				title: "Explore Spectron",
				description:
					"Discover the full potential of Spectron with the official documentation.",
				action: "documentation",
			},
		],
		api: [
			{
				title: "Create an API key",
				description: "Request a new API key to authenticate your requests to the API.",
				action: "api_keys",
			},
			{
				title: "Open a session",
				description:
					"Create a session scoped to a user. The response includes an `id` you'll pass to subsequent calls when recording turns.",
				code: `curl -X POST ${restRoot}/sessions \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"scope":[{"key":"user","value":"alex"}]}'`,
				lang: "bash",
			},
			{
				title: "Capture a memory",
				description:
					"Record a conversation turn against the session you just created. Replace `$SESSION_ID` with the `id` returned from the previous call.",
				code: `curl -X POST ${restRoot}/sessions/$SESSION_ID/turns \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"role":"user","content":"Hi, I am Alex. I prefer dark mode."}'`,
				lang: "bash",
			},
			{
				title: "Recall with hybrid search",
				description:
					"Issue a natural-language query against your stored memories and let the hybrid retrieval pipeline combine vector similarity with graph traversal behind a single endpoint.",
				code: `curl -X POST ${restRoot}/query \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"query":"What are the user preferences?","k":10}'`,
				lang: "bash",
			},
			{
				title: "Explore Spectron",
				description:
					"Discover the full potential of Spectron with the official documentation.",
				action: "documentation",
			},
		],
	};
}

const LANGUAGES: Record<IntegrationTab, { label: string; img?: string; icon?: string }> = {
	python: { label: "Python", img: brandPython },
	javascript: { label: "JavaScript", img: brandJavaScript },
	api: { label: "REST API", icon: iconAPI },
};

function isIntegrationTab(v: string | undefined): v is IntegrationTab {
	return v === "python" || v === "javascript" || v === "api";
}

export default function IntegrationView({ context }: ContextViewProps) {
	const search = useSearchParams();
	const tabFromSearch = search.tab;
	const [activeTab, setActiveTab] = useState<IntegrationTab>(() =>
		isIntegrationTab(tabFromSearch) ? tabFromSearch : "python",
	);
	const navigateContext = useContextNavigator();
	const integrationSteps = useMemo(() => buildIntegrationSteps(context), [context]);
	const steps = integrationSteps[activeTab];

	useEffect(() => {
		if (isIntegrationTab(tabFromSearch)) {
			setActiveTab(tabFromSearch);
		}
	}, [tabFromSearch]);

	const goToPage = (page: ContextViewPage) => {
		navigateContext(context.organization_id, context.id, page);
	};

	return (
		<Paper
			p="lg"
			radius="md"
			className={classes.integrationPane}
		>
			<Header
				kicker="Quick start"
				order={2}
			>
				Connect to your context
			</Header>

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
									{step.action === "api_keys" ? (
										<Button
											mt="sm"
											ml="-xs"
											size="xs"
											color="violet"
											rightSection={<Icon path={iconArrowUpRight} />}
											onClick={() => goToPage("api-keys")}
										>
											Get API key
										</Button>
									) : step.action === "documentation" ? (
										<Button
											mt="sm"
											ml="-xs"
											size="xs"
											color="violet"
											rightSection={<Icon path={iconArrowUpRight} />}
											onClick={() =>
												adapter.openUrl(
													"https://surrealdb.com/docs/learn/context",
												)
											}
										>
											Read the documentation
										</Button>
									) : undefined}
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
			</Stack>
		</Paper>
	);
}
