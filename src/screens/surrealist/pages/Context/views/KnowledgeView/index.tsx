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
	iconBook,
	iconChevronRight,
	iconFile,
	iconRelation,
	iconSearch,
	iconTarget,
	iconUpload,
	pictoAudioClip,
	pictoConnect,
	pictoDocument,
	pictoGraphRAG,
	pictoHTTP,
	pictoImage,
	pictoJSONFile,
	pictoMediaFile,
	pictoPDF,
	pictoText,
} from "@surrealdb/ui";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useContextNavigator } from "~/hooks/routing";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

interface Capability {
	title: string;
	description: string;
	icon: string;
}

const CAPABILITIES: Capability[] = [
	{
		title: "Ingest anything",
		description:
			"Files, pages, API payloads, transcripts - everything is normalised into the same pipeline as your conversations.",
		icon: iconUpload,
	},
	{
		title: "Hybrid retrieval",
		description:
			"Vector similarity, graph traversal, and structured filters resolved in a single query over your knowledge.",
		icon: iconSearch,
	},
	{
		title: "Grounded answers",
		description:
			"Agents cite source material. Each retrieval carries lineage back to the exact document and chunk it came from.",
		icon: iconTarget,
	},
];

interface Stage {
	title: string;
	description: string;
}

const PIPELINE: Stage[] = [
	{ title: "Raw sources", description: "Files, URLs, and streams uploaded into the context." },
	{ title: "Chunk & embed", description: "Content is segmented and vectorised with metadata." },
	{
		title: "Graph & store",
		description: "Entities, relationships, and chunks written atomically.",
	},
	{ title: "Hybrid query", description: "Retrieve with vectors, graph traversal, and filters." },
];

interface SourceType {
	label: string;
	picto: string;
}

const SOURCES: SourceType[] = [
	{ label: "PDF", picto: pictoPDF },
	{ label: "Markdown", picto: pictoText },
	{ label: "JSON", picto: pictoJSONFile },
	{ label: "Documents", picto: pictoDocument },
	{ label: "Web pages", picto: pictoHTTP },
	{ label: "Images", picto: pictoImage },
	{ label: "Audio", picto: pictoAudioClip },
	{ label: "Media", picto: pictoMediaFile },
];

function KnowledgeViewLegacy({ context }: ContextViewProps) {
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
					src={pictoGraphRAG}
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
									path={iconBook}
									size="xs"
								/>
							}
						>
							Knowledge sources
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
						<PrimaryTitle fz={40}>Knowledge</PrimaryTitle>
						<Text
							mt="md"
							fz="lg"
							lh={1.55}
							className="selectable"
						>
							The factual layer you control. Upload documents, stream data, and
							connect sources that ground your agents in source material - not only
							the last few messages.
						</Text>
					</Box>
					<Group gap="sm">
						<Button
							variant="gradient"
							leftSection={<Icon path={iconUpload} />}
							disabled
						>
							Upload sources
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
							How ingestion works
						</Button>
					</Group>
				</Stack>
			</Paper>

			{/* CAPABILITIES */}
			<Box>
				<Text
					fz="xs"
					fw={600}
					c="violet.4"
					tt="uppercase"
					style={{ letterSpacing: "0.08em" }}
				>
					What knowledge unlocks
				</Text>
				<PrimaryTitle
					fz={24}
					mt={4}
					mb="md"
				>
					Ground agents in real source material
				</PrimaryTitle>
				<SimpleGrid
					cols={{ base: 1, md: 3 }}
					spacing="md"
				>
					{CAPABILITIES.map((cap) => (
						<Paper
							key={cap.title}
							p="lg"
							radius="md"
							className={classes.capabilityCard}
						>
							<ThemeIcon
								size={40}
								radius="md"
								variant="light"
								color="violet"
								mb="sm"
							>
								<Icon
									path={cap.icon}
									size="lg"
								/>
							</ThemeIcon>
							<Text
								fw={600}
								c="bright"
								fz="md"
							>
								{cap.title}
							</Text>
							<Text
								mt={6}
								fz="sm"
								lh={1.55}
								className="selectable"
							>
								{cap.description}
							</Text>
						</Paper>
					))}
				</SimpleGrid>
			</Box>

			{/* PIPELINE */}
			<Paper
				p="lg"
				radius="md"
				withBorder
				bg="var(--mantine-color-obsidian-light)"
			>
				<Group
					justify="space-between"
					align="flex-end"
					mb="md"
					wrap="wrap"
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
							Ingestion pipeline
						</Text>
						<PrimaryTitle
							fz={22}
							mt={4}
						>
							From raw source to queryable fact
						</PrimaryTitle>
					</Box>
					<Group gap="xs">
						<Image
							src={pictoConnect}
							w={36}
							alt=""
							aria-hidden
							style={{ opacity: 0.7 }}
						/>
					</Group>
				</Group>

				<Box className={classes.pipelineRow}>
					{PIPELINE.map((stage, idx) => (
						<Group
							key={stage.title}
							gap={0}
							wrap="nowrap"
							style={{ flex: 1, minWidth: 140 }}
						>
							<Box
								className={classes.pipelineStage}
								style={{ flex: 1 }}
							>
								<Badge
									size="xs"
									variant="light"
									color="violet"
									mb={6}
								>
									Step {idx + 1}
								</Badge>
								<Text
									fw={600}
									c="bright"
									fz="sm"
								>
									{stage.title}
								</Text>
								<Text
									mt={4}
									fz="xs"
									lh={1.5}
									className="selectable"
								>
									{stage.description}
								</Text>
							</Box>
							{idx < PIPELINE.length - 1 && (
								<Box className={classes.pipelineArrow}>
									<Icon
										path={iconChevronRight}
										size="sm"
									/>
								</Box>
							)}
						</Group>
					))}
				</Box>
			</Paper>

			{/* SUPPORTED SOURCES */}
			<Box>
				<Text
					fz="xs"
					fw={600}
					c="violet.4"
					tt="uppercase"
					style={{ letterSpacing: "0.08em" }}
				>
					Supported sources
				</Text>
				<PrimaryTitle
					fz={22}
					mt={4}
					mb="md"
				>
					Bring any source of truth
				</PrimaryTitle>
				<SimpleGrid
					cols={{ base: 2, xs: 4, md: 8 }}
					spacing="sm"
				>
					{SOURCES.map((src) => (
						<Box
							key={src.label}
							className={classes.sourceBadge}
						>
							<Image
								src={src.picto}
								w={36}
								h={36}
								alt=""
								aria-hidden
							/>
							<Text
								fz="xs"
								c="bright"
								fw={500}
							>
								{src.label}
							</Text>
						</Box>
					))}
				</SimpleGrid>
			</Box>

			{/* UPLOAD (coming soon) */}
			<Paper
				p="lg"
				radius="md"
				className={classes.uploadPane}
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
								Manage knowledge sources
							</Text>
						</Group>
						<Text
							fz="sm"
							className="selectable"
							lh={1.55}
						>
							Drag and drop files, connect external stores, and watch ingestion
							progress in real time. Every source keeps its lineage so you can audit
							what your agents know and where it came from.
						</Text>
					</Box>
					<Group gap="sm">
						<Button
							variant="subtle"
							color="violet"
							onClick={() =>
								navigateContext(context.organization_id, context.id, "memories")
							}
							rightSection={<Icon path={iconArrowUpRight} />}
						>
							See what gets extracted
						</Button>
					</Group>
				</Group>
				<Box className={classes.uploadDrop}>
					<Stack
						gap="xs"
						align="center"
					>
						<ThemeIcon
							size={48}
							radius="xl"
							variant="light"
							color="violet"
						>
							<Icon
								path={iconUpload}
								size="xl"
							/>
						</ThemeIcon>
						<Text
							fw={600}
							c="bright"
						>
							Drop files, URLs, or JSON here
						</Text>
						<Text
							fz="sm"
							className="selectable"
						>
							Supported formats include PDF, Markdown, JSON, HTML, and plain text.
						</Text>
					</Stack>
				</Box>
				<Group
					gap="xs"
					mt="md"
					justify="center"
				>
					<Icon
						path={iconFile}
						size="xs"
						c="slate"
					/>
					<Text
						fz="xs"
						c="slate"
					>
						Or connect a source programmatically via the API
					</Text>
					<Icon
						path={iconRelation}
						size="xs"
						c="slate"
					/>
				</Group>
			</Paper>
		</Stack>
	);
}

export default function KnowledgeView({ context }: ContextViewProps) {
	return (
		<Stack gap="md">
			<Paper
				p="xl"
				radius="lg"
				variant="glass"
				className={classes.hero}
			>
				<Image
					src={pictoGraphRAG}
					className={classes.heroArt}
					alt=""
					aria-hidden
				/>
				<Header
					kicker="Ingest"
					description="Ground your context in files, documents, and ingressed data."
					titleProps={{ variant: "gradient" }}
				>
					Knowledge
				</Header>
			</Paper>

			{false && <KnowledgeViewLegacy context={context} />}
		</Stack>
	);
}
