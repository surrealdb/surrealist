import {
	Anchor,
	Badge,
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
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import {
	brandJavaScript,
	brandPython,
	CodeBlock,
	Icon,
	iconAPI,
	iconArrowUpRight,
	iconAuth,
	iconCheckCircle,
	iconCloudClock,
	iconOpen,
	iconPlay,
	iconRelation,
	iconServerSecure,
	iconSpectron,
	pictoConnect,
	pictoGraph,
	pictoMemory,
	pictoSpectron,
	pictoVectorSearch,
} from "@surrealdb/ui";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CONTEXT_VIEW_PAGES } from "~/constants";
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
    {"role": "assistant", "content": "Got it, Alex — noted."},
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
    { role: "assistant", content: "Got it, Alex — noted." },
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

interface Capability {
	label: string;
	description: string;
	icon: string;
}

const CAPABILITIES: Capability[] = [
	{
		label: "ACID memory",
		description: "Atomic writes across entities, facts, and embeddings.",
		icon: iconServerSecure,
	},
	{
		label: "Temporal facts",
		description: "Bi-temporal history — know what was true and when.",
		icon: iconCloudClock,
	},
	{
		label: "Hybrid retrieval",
		description: "Graph traversal, vector search, and filters in one call.",
		icon: iconRelation,
	},
	{
		label: "Multi-agent",
		description: "Shared memory for coordinated agent swarms.",
		icon: iconAuth,
	},
];

interface PipelineStep {
	id: string;
	number: string;
	title: string;
	summary: string;
	detail: string;
	target: ContextViewPage;
	targetLabel: string;
	picto: string;
}

const PIPELINE: PipelineStep[] = [
	{
		id: "ingest",
		number: "01",
		title: "Ingest",
		summary: "Conversations, documents, and tool outputs flow in.",
		detail: "Feed raw text, JSON, or file uploads. Spectron normalises the input so conversations and documents share the same pipeline.",
		target: "knowledge",
		targetLabel: "Browse Knowledge",
		picto: pictoConnect,
	},
	{
		id: "extract",
		number: "02",
		title: "Extract",
		summary: "Entities, relationships, facts, and embeddings.",
		detail: "Structured memory is generated automatically — disambiguated entities, temporal facts, and vector embeddings written atomically in one transaction.",
		target: "memories",
		targetLabel: "Open Memories",
		picto: pictoMemory,
	},
	{
		id: "retrieve",
		number: "03",
		title: "Retrieve",
		summary: "Hybrid search over graph + vectors + filters.",
		detail: "Query your context with a single call. Graph traversal, semantic similarity, and structured predicates combine to return precisely the context the agent needs.",
		target: "playground",
		targetLabel: "Try the Playground",
		picto: pictoVectorSearch,
	},
	{
		id: "integrate",
		number: "04",
		title: "Integrate",
		summary: "Ship it into your agent with SDKs or the REST API.",
		detail: "Mint an API key, point your SDK at this context, and your agents pick up continuity, preferences, and shared knowledge on day one.",
		target: "api-keys",
		targetLabel: "Manage API Keys",
		picto: pictoGraph,
	},
];

interface NavItem {
	page: ContextViewPage;
	description: string;
	picto: string;
}

const NAV_ITEMS: NavItem[] = [
	{
		page: "playground",
		description: "Chat with your context and watch memories form in real time.",
		picto: pictoVectorSearch,
	},
	{
		page: "memories",
		description: "Inspect the agent-learned memory graph that grows with usage.",
		picto: pictoMemory,
	},
	{
		page: "knowledge",
		description: "Ground your context in files, documents, and ingressed data.",
		picto: pictoConnect,
	},
	{
		page: "api-keys",
		description: "Create keys and connect SDKs, agents, or the REST API.",
		picto: pictoGraph,
	},
];

export default function DashboardView({ context }: ContextViewProps) {
	const [activeTab, setActiveTab] = useState<IntegrationTab>("python");
	const [activeStepId, setActiveStepId] = useState<string>(PIPELINE[0].id);
	const navigateContext = useContextNavigator();
	const steps = INTEGRATION_STEPS[activeTab];
	const activeStep = PIPELINE.find((step) => step.id === activeStepId) ?? PIPELINE[0];

	const goToPage = (page: ContextViewPage) => {
		navigateContext(context.organization_id, context.id, page);
	};

	return (
		<Stack gap={48}>
			{/* HERO */}
			<Paper
				p="xl"
				radius="lg"
				className={classes.hero}
			>
				<Image
					src={pictoSpectron}
					className={classes.heroArt}
					alt=""
					aria-hidden
				/>
				<Stack
					gap="lg"
					pos="relative"
					style={{ zIndex: 1 }}
				>
					<Group gap="xs">
						<Badge
							size="sm"
							variant="light"
							color="violet"
							leftSection={
								<Icon
									path={iconSpectron}
									size="xs"
								/>
							}
						>
							Context · Agent memory
						</Badge>
						<Badge
							size="sm"
							variant="default"
						>
							{context.region}
						</Badge>
					</Group>
					<Box maw={640}>
						<PrimaryTitle
							fz={40}
							className="selectable"
						>
							{context.name}
						</PrimaryTitle>
						<Text
							mt="md"
							fz="lg"
							lh={1.55}
							className="selectable"
						>
							Agent memory that lives inside the database. Ingest conversations and
							documents, extract structure, and retrieve with hybrid search — no
							middleware, no consistency gaps.
						</Text>
					</Box>
					<Group gap="sm">
						<Button
							variant="gradient"
							leftSection={<Icon path={iconPlay} />}
							onClick={() => goToPage("playground")}
						>
							Open playground
						</Button>
						<Button
							component="a"
							href="https://surrealdb.com/platform/spectron"
							target="_blank"
							rel="noopener noreferrer"
							variant="subtle"
							color="slate"
							rightSection={<Icon path={iconArrowUpRight} />}
						>
							Read about Spectron
						</Button>
					</Group>
				</Stack>
			</Paper>

			{/* CAPABILITY STRIP */}
			<SimpleGrid
				cols={{ base: 1, xs: 2, md: 4 }}
				spacing="sm"
			>
				{CAPABILITIES.map((cap) => (
					<Paper
						key={cap.label}
						p="md"
						radius="md"
						className={classes.capabilityPill}
					>
						<Group
							gap="sm"
							wrap="nowrap"
							align="flex-start"
						>
							<ThemeIcon
								size={34}
								radius="md"
								variant="light"
								color="violet"
							>
								<Icon path={cap.icon} />
							</ThemeIcon>
							<Box miw={0}>
								<Text
									fw={600}
									c="bright"
									fz="sm"
								>
									{cap.label}
								</Text>
								<Text
									fz="xs"
									lh={1.45}
									mt={2}
									className="selectable"
								>
									{cap.description}
								</Text>
							</Box>
						</Group>
					</Paper>
				))}
			</SimpleGrid>

			{/* INTERACTIVE PIPELINE */}
			<Box>
				<Group
					justify="space-between"
					align="flex-end"
					mb="md"
				>
					<Box>
						<Text
							fz="xs"
							fw={600}
							c="violet.4"
							tt="uppercase"
							style={{ letterSpacing: "0.08em" }}
						>
							How it works
						</Text>
						<PrimaryTitle
							mt={4}
							fz={24}
						>
							From raw input to agent context
						</PrimaryTitle>
					</Box>
					<Text
						fz="sm"
						c="slate"
						visibleFrom="sm"
					>
						Click a stage to explore
					</Text>
				</Group>

				<Group
					gap="xs"
					wrap="nowrap"
					align="stretch"
					style={{ overflowX: "auto" }}
				>
					{PIPELINE.map((step, idx) => (
						<Group
							key={step.id}
							gap="xs"
							wrap="nowrap"
							style={{ flex: 1, minWidth: 180 }}
						>
							<UnstyledButton
								onClick={() => setActiveStepId(step.id)}
								className={classes.pipelineCard}
								data-active={step.id === activeStepId}
								aria-pressed={step.id === activeStepId}
								style={{ flex: 1, borderRadius: 12 }}
							>
								<Paper
									p="md"
									radius="md"
									bg="transparent"
								>
									<Group
										justify="space-between"
										align="flex-start"
										wrap="nowrap"
										mb="xs"
									>
										<Text
											fz="xs"
											c="slate"
											fw={700}
											className={classes.pipelineStepNumber}
										>
											{step.number}
										</Text>
										<ThemeIcon
											size={28}
											radius="md"
											variant={
												step.id === activeStepId ? "gradient" : "light"
											}
											color="violet"
										>
											<Image
												src={step.picto}
												w={18}
												alt=""
												aria-hidden
											/>
										</ThemeIcon>
									</Group>
									<Text
										fw={600}
										c="bright"
										fz="md"
									>
										{step.title}
									</Text>
									<Text
										fz="xs"
										mt={4}
										lh={1.45}
										className="selectable"
									>
										{step.summary}
									</Text>
								</Paper>
							</UnstyledButton>
							{idx < PIPELINE.length - 1 && (
								<Box
									className={classes.pipelineConnector}
									visibleFrom="sm"
								/>
							)}
						</Group>
					))}
				</Group>

				{/* Active step detail panel */}
				<Paper
					p="lg"
					radius="md"
					mt="md"
					bg="var(--mantine-color-obsidian-light)"
					withBorder
				>
					<Group
						align="flex-start"
						justify="space-between"
						gap="lg"
						wrap="wrap"
					>
						<Box
							maw={640}
							flex={1}
						>
							<Group gap="xs">
								<Badge
									size="sm"
									variant="light"
									color="violet"
								>
									Stage {activeStep.number}
								</Badge>
								<Text
									fw={600}
									c="bright"
								>
									{activeStep.title}
								</Text>
							</Group>
							<Text
								mt="xs"
								lh={1.6}
								className="selectable"
							>
								{activeStep.detail}
							</Text>
						</Box>
						<Button
							variant="light"
							color="violet"
							rightSection={<Icon path={iconArrowUpRight} />}
							onClick={() => goToPage(activeStep.target)}
						>
							{activeStep.targetLabel}
						</Button>
					</Group>
				</Paper>
			</Box>

			{/* NAVIGATION GRID */}
			<Box>
				<Text
					fz="xs"
					fw={600}
					c="violet.4"
					tt="uppercase"
					style={{ letterSpacing: "0.08em" }}
					mb={4}
				>
					Navigate
				</Text>
				<PrimaryTitle
					fz={24}
					mb="md"
				>
					Work with this context
				</PrimaryTitle>
				<SimpleGrid
					cols={{ base: 1, sm: 2 }}
					spacing="md"
				>
					{NAV_ITEMS.map((item) => {
						const meta = CONTEXT_VIEW_PAGES[item.page];
						return (
							<Anchor
								key={item.page}
								variant="glow"
								c="var(--mantine-color-text)"
								onClick={() => goToPage(item.page)}
								style={{ cursor: "pointer" }}
							>
								<Paper
									p="lg"
									radius="md"
									className={classes.navCard}
								>
									<Group
										gap="md"
										wrap="nowrap"
										align="flex-start"
										pos="relative"
										style={{ zIndex: 1 }}
									>
										<ThemeIcon
											size={44}
											radius="md"
											variant="light"
											color="violet"
										>
											<Icon
												path={meta.icon}
												size="lg"
											/>
										</ThemeIcon>
										<Box flex={1}>
											<Text
												fw={600}
												fz="md"
												c="bright"
											>
												{meta.name}
											</Text>
											<Text
												mt={4}
												fz="sm"
												lh={1.5}
												className="selectable"
											>
												{item.description}
											</Text>
										</Box>
										<Icon
											path={iconArrowUpRight}
											size="sm"
											c="slate"
										/>
									</Group>
									<Image
										src={item.picto}
										className={classes.navCardArt}
										alt=""
										aria-hidden
									/>
								</Paper>
							</Anchor>
						);
					})}
				</SimpleGrid>
			</Box>

			{/* INTEGRATION */}
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
							href="https://surrealdb.com/docs/context"
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
		</Stack>
	);
}
