import {
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
} from "@mantine/core";
import {
	Header,
	Icon,
	iconArrowUpRight,
	iconClock,
	iconMemory,
	iconRelation,
	iconSearch,
	iconTag,
	pictoBarsGradient,
	pictoBrainGradient,
	pictoKnowledgeGraphGradient,
	pictoMemoryGradient,
} from "@surrealdb/ui";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useContextNavigator } from "~/hooks/routing";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

interface MemoryTypeCard {
	type: string;
	title: string;
	description: string;
	icon: string;
	picto: string;
}

const MEMORY_TYPES: MemoryTypeCard[] = [
	{
		type: "Episodic",
		title: "Session continuity",
		description:
			"Every conversation turn is captured and classified, so agents pick up where they left off instead of starting from zero.",
		icon: iconClock,
		picto: pictoBarsGradient,
	},
	{
		type: "Semantic",
		title: "Facts and entities",
		description:
			"Structured knowledge extracted from interactions - people, places, preferences, and the relationships between them.",
		icon: iconRelation,
		picto: pictoKnowledgeGraphGradient,
	},
	{
		type: "Procedural",
		title: "Preferences and patterns",
		description:
			"Recurring user preferences, feedback, and behavioural patterns surface from episodic memory without explicit annotation.",
		icon: iconTag,
		picto: pictoBrainGradient,
	},
];

interface MemoryFeature {
	title: string;
	description: string;
	icon: string;
}

const FEATURES: MemoryFeature[] = [
	{
		title: "Entity disambiguation",
		description:
			"“My manager”, “Sarah”, and “the VP of Engineering” are resolved to the same entity across sessions.",
		icon: iconTag,
	},
	{
		title: "Temporal awareness",
		description:
			"Bi-temporal, append-only facts track when things were true and when they were recorded.",
		icon: iconClock,
	},
	{
		title: "Hybrid retrieval",
		description:
			"Graph traversal, vector similarity, and structured filters resolved in one ACID query.",
		icon: iconSearch,
	},
];

interface SampleMemory {
	label: string;
	type: string;
	ts: string;
}

const SAMPLE_MEMORIES: SampleMemory[] = [
	{ label: "User prefers dark mode in all applications", type: "Preference", ts: "2d ago" },
	{ label: "Manages the Atlas project with Alice and Dev", type: "Relation", ts: "2d ago" },
	{ label: "Located in London, United Kingdom", type: "Fact", ts: "4d ago" },
	{ label: "Completed onboarding for Spectron SDK", type: "Episodic", ts: "5d ago" },
];

function MemoriesViewLegacy({ context }: ContextViewProps) {
	const navigateContext = useContextNavigator();

	return (
		<Stack gap={40}>
			{/* HERO */}
			<Paper
				p="xl"
				radius="lg"
				className={classes.hero}
			>
				<Image
					src={pictoMemoryGradient}
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
									path={iconMemory}
									size="xs"
								/>
							}
						>
							Memory graph
						</Badge>
						<Badge
							size="sm"
							variant="outline"
							color="slate"
						>
							Coming soon
						</Badge>
					</Group>
					<Box maw={620}>
						<PrimaryTitle fz={40}>Memories</PrimaryTitle>
						<Text
							mt="md"
							fz="lg"
							lh={1.55}
							className="selectable"
						>
							The structured memory your agents accumulate over time - episodic
							traces, semantic facts, and learned preferences, all organised into a
							queryable knowledge graph.
						</Text>
					</Box>
					<Group gap="sm">
						<Button
							variant="gradient"
							rightSection={<Icon path={iconArrowUpRight} />}
							onClick={() =>
								navigateContext(context.organization_id, context.id, "playground")
							}
						>
							See memories form live
						</Button>
						<Button
							component="a"
							href="https://surrealdb.com/docs/spectron"
							target="_blank"
							rel="noopener noreferrer"
							variant="subtle"
							color="slate"
							rightSection={<Icon path={iconArrowUpRight} />}
						>
							How Spectron stores memory
						</Button>
					</Group>
				</Stack>
			</Paper>

			{/* MEMORY TYPES */}
			<Box>
				<Text
					fz="xs"
					fw={600}
					c="violet.4"
					tt="uppercase"
					style={{ letterSpacing: "0.08em" }}
				>
					What gets remembered
				</Text>
				<PrimaryTitle
					fz={24}
					mt={4}
					mb="md"
				>
					Three memory types, one graph
				</PrimaryTitle>
				<SimpleGrid
					cols={{ base: 1, md: 3 }}
					spacing="md"
				>
					{MEMORY_TYPES.map((item) => (
						<Paper
							key={item.type}
							p="lg"
							radius="md"
							className={classes.capabilityCard}
						>
							<Stack gap="sm">
								<Group
									justify="space-between"
									align="flex-start"
								>
									<ThemeIcon
										size={40}
										radius="md"
										variant="light"
										color="violet"
									>
										<Icon
											path={item.icon}
											size="lg"
										/>
									</ThemeIcon>
									<Image
										src={item.picto}
										w={48}
										h={48}
										alt=""
										aria-hidden
										style={{ opacity: 0.65 }}
									/>
								</Group>
								<Box>
									<Badge
										size="xs"
										variant="light"
										color="slate"
										mb={6}
									>
										{item.type}
									</Badge>
									<Text
										fw={600}
										c="bright"
										fz="md"
									>
										{item.title}
									</Text>
									<Text
										mt={6}
										fz="sm"
										lh={1.55}
										className="selectable"
									>
										{item.description}
									</Text>
								</Box>
							</Stack>
						</Paper>
					))}
				</SimpleGrid>
			</Box>

			{/* UNDER THE HOOD */}
			<Paper
				p="lg"
				radius="md"
				withBorder
				bg="var(--mantine-color-obsidian-light)"
			>
				<SimpleGrid
					cols={{ base: 1, md: 2 }}
					spacing="xl"
				>
					<Stack gap="md">
						<Box>
							<Text
								fz="xs"
								fw={600}
								c="violet.4"
								tt="uppercase"
								style={{ letterSpacing: "0.08em" }}
							>
								Under the hood
							</Text>
							<PrimaryTitle
								fz={22}
								mt={4}
							>
								Memory that keeps thinking
							</PrimaryTitle>
						</Box>
						<Text
							fz="sm"
							className="selectable"
							lh={1.6}
						>
							Between interactions, background processes deepen the graph -
							discovering connections, consolidating fragmented facts, and resolving
							ambiguous references as more context accumulates.
						</Text>
						<Stack
							gap="sm"
							mt="xs"
						>
							{FEATURES.map((f) => (
								<Group
									key={f.title}
									gap="md"
									wrap="nowrap"
									align="flex-start"
								>
									<ThemeIcon
										size={28}
										radius="md"
										variant="light"
										color="violet"
									>
										<Icon path={f.icon} />
									</ThemeIcon>
									<Box>
										<Text
											fw={600}
											c="bright"
											fz="sm"
										>
											{f.title}
										</Text>
										<Text
											fz="sm"
											className="selectable"
											lh={1.5}
										>
											{f.description}
										</Text>
									</Box>
								</Group>
							))}
						</Stack>
					</Stack>
					<Box className={classes.graphIllustration}>
						<Box className={classes.graphArt}>
							<Image
								src={pictoKnowledgeGraphGradient}
								w={220}
								alt=""
								aria-hidden
							/>
						</Box>
					</Box>
				</SimpleGrid>
			</Paper>

			{/* LIVE PREVIEW (coming soon) */}
			<Paper
				p="lg"
				radius="md"
				className={classes.previewPane}
			>
				<Group
					justify="space-between"
					align="flex-start"
					mb="md"
					wrap="wrap"
					gap="md"
				>
					<Box maw={520}>
						<Group
							gap="xs"
							mb={6}
						>
							<Badge
								size="sm"
								variant="outline"
								color="violet"
							>
								Coming soon
							</Badge>
							<Text
								fw={600}
								c="bright"
							>
								Memory explorer
							</Text>
						</Group>
						<Text
							fz="sm"
							className="selectable"
							lh={1.55}
						>
							Browse, search, and edit memories as they form. Filter by entity, type,
							or timeframe; trace why a fact was included; and step back through the
							graph as it evolved.
						</Text>
					</Box>
					<Button
						variant="subtle"
						color="violet"
						disabled
						rightSection={<Icon path={iconArrowUpRight} />}
					>
						Open explorer
					</Button>
				</Group>
				<Stack gap="xs">
					{SAMPLE_MEMORIES.map((sample) => (
						<Box
							key={sample.label}
							className={classes.ghostRow}
						>
							<Badge
								size="xs"
								variant="light"
								color="slate"
							>
								{sample.type}
							</Badge>
							<Box>
								<Text
									fz="sm"
									c="bright"
									className="selectable"
								>
									{sample.label}
								</Text>
								<Box
									className={classes.ghostBar}
									mt={6}
									w="60%"
								/>
							</Box>
							<Text
								fz="xs"
								c="slate"
							>
								{sample.ts}
							</Text>
						</Box>
					))}
				</Stack>
			</Paper>
		</Stack>
	);
}

export default function MemoriesView({ context }: ContextViewProps) {
	return (
		<Stack gap="md">
			<Paper
				p="xl"
				radius="lg"
				variant="glass"
				className={classes.hero}
			>
				<Image
					src={pictoBrain}
					className={classes.heroArt}
					alt=""
					aria-hidden
				/>
				<Header
					kicker="Inspect"
					description="Inspect the agent-learned memory graph that grows with usage."
					titleProps={{ variant: "gradient" }}
				>
					Memories
				</Header>
			</Paper>

			{false && <MemoriesViewLegacy context={context} />}
		</Stack>
	);
}
