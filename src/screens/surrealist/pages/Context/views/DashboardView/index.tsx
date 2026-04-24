import {
	Anchor,
	Badge,
	Box,
	Button,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	ThemeIcon,
	Title,
	UnstyledButton,
} from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconPackageClosed,
	iconPlay,
	pictoConnect,
	pictoGraph,
	pictoMemory,
	pictoSpectron,
	pictoVectorSearch,
} from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CONTEXT_VIEW_PAGES, REGION_FLAGS } from "~/constants";
import { useContextNavigator } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import type { ContextViewPage } from "~/types";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

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
		target: "integration",
		targetLabel: "View integration guide",
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
		page: "integration",
		description: "Step-by-step setup for Python, JavaScript, and the REST API.",
		picto: pictoGraph,
	},
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
	const [activeStepId, setActiveStepId] = useState<string>(PIPELINE[0].id);
	const navigateContext = useContextNavigator();
	const regions = useCloudStore((s) => s.contextRegions);
	const activeStep = PIPELINE.find((step) => step.id === activeStepId) ?? PIPELINE[0];

	const region = useMemo(
		() => regions.find((r) => r.slug === context.region),
		[regions, context.region],
	);

	const goToPage = (page: ContextViewPage) => {
		navigateContext(context.organization_id, context.id, page);
	};

	return (
		<Stack gap={48}>
			{/* HERO */}
			<Paper
				p="xl"
				radius="lg"
				variant="glass"
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
					<Box maw={640}>
						<Text
							fz="xs"
							fw={600}
							c="violet.4"
							tt="uppercase"
							style={{ letterSpacing: "0.08em" }}
						>
							Context
						</Text>
						<Title
							fz={{ base: 28, sm: 36 }}
							variant="gradient"
							lh={1}
						>
							{context.name}
						</Title>
						<Group
							gap="xs"
							mt="sm"
						>
							<Badge
								size="sm"
								variant="transparent"
								px={0}
								leftSection={
									<Image
										src={REGION_FLAGS[context.region]}
										w={14}
										mr="xs"
									/>
								}
							>
								{region?.description}
							</Badge>
						</Group>
					</Box>
					<Group
						gap="sm"
						mt="sm"
					>
						<Button
							variant="gradient"
							leftSection={<Icon path={iconPlay} />}
							onClick={() => goToPage("playground")}
						>
							Open playground
						</Button>
						<Button
							onClick={() => goToPage("integration")}
							rightSection={<Icon path={iconPackageClosed} />}
						>
							Integrate Spectron
						</Button>
					</Group>
				</Stack>
			</Paper>
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
			;
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
			;
		</Stack>
	);
}
