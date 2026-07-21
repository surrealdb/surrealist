import {
	Box,
	Button,
	Collapse,
	Group,
	Image,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Timeline,
	Title,
	UnstyledButton,
} from "@mantine/core";
import {
	HoverGlow,
	Icon,
	iconArrowRight,
	iconArrowUpRight,
	type MarkdownComponents,
	MarkdownViewer,
	pictoIntegrationsGradient,
} from "@surrealdb/ui";
import { useEffect, useMemo, useState } from "react";
import { adapter } from "~/adapter";
import { useContextNavigator, useSearchParams } from "~/hooks/routing";
import { useIsLight } from "~/hooks/theme";
import type { CloudContext } from "~/types";
import { dedent } from "~/util/dedent";
import { ContextHero } from "../../components/ContextHero";
import type { ContextViewProps } from "../../types";
import {
	INTEGRATION_CATEGORIES,
	INTEGRATION_META,
	type IntegrationId,
	type IntegrationMeta,
	isIntegrationId,
} from "./helpers/catalogue";
import { getSpectronUrls } from "./helpers/spectron-urls";
import { buildClaudeCodeSteps } from "./integrations/claude-code";
import { buildCliSteps } from "./integrations/cli";
import { buildCloudflareSteps } from "./integrations/cloudflare";
import { buildCodexSteps } from "./integrations/codex";
import { buildCrewAiSteps } from "./integrations/crew-ai";
import { buildCursorSteps } from "./integrations/cursor";
import { buildDartSteps } from "./integrations/dart";
import { buildElixirSteps } from "./integrations/elixir";
import { buildEveSteps } from "./integrations/eve";
import { buildGolangSteps } from "./integrations/golang";
import { buildGoogleAdkSteps } from "./integrations/google-adk";
import { buildHaskellSteps } from "./integrations/haskell";
import { buildHermesSteps } from "./integrations/hermes";
import { buildKotlinSteps } from "./integrations/kotlin";
import { buildLangChainSteps } from "./integrations/langchain";
import { buildMcpSteps } from "./integrations/mcp";
import { buildN8nSteps } from "./integrations/n8n";
import { buildOpenAiAgentsSteps } from "./integrations/openai-agents";
import { buildOpenClawSteps } from "./integrations/openclaw";
import { buildPydanticAiSteps } from "./integrations/pydantic-ai";
import { buildStrandsSteps } from "./integrations/strands";
import { buildSwiftSteps } from "./integrations/swift";
import { buildTanStackSteps } from "./integrations/tanstack";
import type { IntegrationStep } from "./integrations/types";
import { buildVercelAiSteps } from "./integrations/vercel-ai";
import { buildVsCodeSteps } from "./integrations/vscode";
import { buildZapierSteps } from "./integrations/zapier";
import { buildZedSteps } from "./integrations/zed";
import classes from "./style.module.scss";

function buildIntegrationSteps(
	context: CloudContext,
): Partial<Record<IntegrationId, IntegrationStep[]>> {
	const { endpoint, restRoot } = getSpectronUrls(context);

	return {
		python: [
			{
				title: "Install the SDK",
				description: dedent(`
					Pull the official Python package into your environment.

					~~~bash
					pip install surrealdb
					~~~
				`),
			},
			{
				title: "Initialise the client",
				description: dedent(`
					Create a Spectron client pointing at this context. The endpoint and context id are pre-filled from your selection.

					~~~python
					from surrealdb import Spectron

					client = Spectron(
					    context="${context.id}",
					    endpoint="${endpoint}",
					    api_key="your-api-key",
					)
					~~~

					<ApiKey />
				`),
			},
			{
				title: "Capture a memory",
				description: dedent(`
					Record a fact scoped to a user. Spectron pulls out entities, attributes, and relations server-side, so the memory graph fills in on its own.

					~~~python
					client.remember(
					    "Hi, I'm Alex. I prefer dark mode.",
					    infer="full",
					    scope=["user/alex"],
					)
					~~~
				`),
			},
			{
				title: "Recall with hybrid search",
				description: dedent(`
					Run one query that blends graph traversal, vector similarity, and structured filters, then get the most relevant memories back in a single call.

					~~~python
					results = client.recall("What are the user's preferences?", k=10)

					for hit in results.hits:
					    print(hit.score, hit.text)
					~~~
				`),
			},
			{
				title: "Explore Spectron",
				description: dedent(`
					The official documentation covers the rest of what Spectron can do.

					<Documentation />
				`),
			},
		],
		javascript: [
			{
				title: "Install the SDK",
				description: dedent(`
					Add the Spectron npm package to your project.

					~~~bash
					npm install @surrealdb/spectron
					~~~
				`),
			},
			{
				title: "Initialise the client",
				description: dedent(`
					Create a Spectron client pointing at this context. The base URL and context id are pre-filled from your selection.

					~~~javascript
					import { Spectron } from "@surrealdb/spectron";

					const client = new Spectron({
					    context: "${context.id}",
					    endpoint: "${endpoint}",
					    apiKey: "your-api-key",
					});
					~~~

					<ApiKey />
				`),
			},
			{
				title: "Capture a memory",
				description: dedent(`
					Record a fact scoped to a user. Spectron pulls out entities, attributes, and relations server-side, so the memory graph fills in on its own.

					~~~javascript
					await client.remember("Hi, I'm Alex. I prefer dark mode.", {
					    infer: "full",
					    scope: ["user/alex"],
					});
					~~~
				`),
			},
			{
				title: "Recall with hybrid search",
				description: dedent(`
					Run one query that blends graph traversal, vector similarity, and structured filters, then get the most relevant memories back in a single call.

					~~~javascript
					const hits = await client.recall("What are the user's preferences?", { k: 10 });
					~~~
				`),
			},
			{
				title: "Explore Spectron",
				description: dedent(`
					The official documentation covers the rest of what Spectron can do.

					<Documentation />
				`),
			},
		],
		api: [
			{
				title: "Create an API key",
				description: dedent(`
					Request a new API key to authenticate your requests to the API.

					<ApiKey />
				`),
			},
			{
				title: "Capture a memory",
				description: dedent(`
					Record a fact against this context. Spectron extracts entities, attributes, and relations server-side, so the memory graph fills in on its own.

					~~~bash
					curl -X POST ${restRoot}/facts \\
					    -H "Authorization: Bearer your-api-key" \\
					    -H "Content-Type: application/json" \\
					    -d '{"text":"Hi, I am Alex. I prefer dark mode.","infer":"full","scope":["user/alex"]}'
					~~~

					To ingest a whole conversation at once, POST a \`turns\` array to \`${restRoot}/facts/batch\` instead.
				`),
			},
			{
				title: "Recall with hybrid search",
				description: dedent(`
					Issue a natural-language query against your stored memories. The hybrid retrieval pipeline combines vector similarity with graph traversal behind one endpoint.

					~~~bash
					curl -X POST ${restRoot}/query \\
					    -H "Authorization: Bearer your-api-key" \\
					    -H "Content-Type: application/json" \\
					    -d '{"query":"What are the user preferences?","limit":10,"scope":["user/alex"]}'
					~~~
				`),
			},
			{
				title: "Explore Spectron",
				description: dedent(`
					The official documentation covers the rest of what Spectron can do.

					<Documentation />
				`),
			},
		],
		go: buildGolangSteps(context),
		swift: buildSwiftSteps(context),
		kotlin: buildKotlinSteps(context),
		haskell: buildHaskellSteps(context),
		elixir: buildElixirSteps(context),
		dart: buildDartSteps(context),
		cli: buildCliSteps(context),
		"claude-code": buildClaudeCodeSteps(context),
		codex: buildCodexSteps(context),
		cursor: buildCursorSteps(context),
		openclaw: buildOpenClawSteps(context),
		hermes: buildHermesSteps(context),
		vscode: buildVsCodeSteps(context),
		zed: buildZedSteps(context),
		mcp: buildMcpSteps(context),
		n8n: buildN8nSteps(context),
		zapier: buildZapierSteps(context),
		langchain: buildLangChainSteps(context),
		"openai-agents": buildOpenAiAgentsSteps(context),
		"crew-ai": buildCrewAiSteps(context),
		"google-adk": buildGoogleAdkSteps(context),
		"pydantic-ai": buildPydanticAiSteps(context),
		strands: buildStrandsSteps(context),
		eve: buildEveSteps(context),
		"vercel-ai": buildVercelAiSteps(context),
		cloudflare: buildCloudflareSteps(context),
		"tanstack-ai": buildTanStackSteps(context),
	};
}

const DOCS_FALLBACK = "https://surrealdb.com/docs/spectron";

/** Renders a large brand image or a monochrome icon for an integration. */
function IntegrationGlyph({ meta, size }: { meta: IntegrationMeta; size: number }) {
	const isLight = useIsLight();

	if (meta.img) {
		const src = typeof meta.img === "string" ? meta.img : meta.img[isLight ? "dark" : "light"];

		return (
			<Image
				src={src}
				w={size}
				h={size}
				alt=""
				fit="contain"
			/>
		);
	}

	if (meta.icon) {
		return (
			<Icon
				path={meta.icon}
				size={size}
				c="violet"
			/>
		);
	}

	return null;
}

interface IntegrationCardProps {
	id: IntegrationId;
	hasSteps: boolean;
	onSelect: (id: IntegrationId) => void;
}

function IntegrationCard({ id, hasSteps, onSelect }: IntegrationCardProps) {
	const meta = INTEGRATION_META[id];

	if (meta.comingSoon) {
		return (
			<Paper
				p="lg"
				radius="md"
				className={`${classes.card} ${classes.cardComingSoon}`}
				style={{ pointerEvents: "none", opacity: 0.6 }}
				withBorder
			>
				{meta.img && (
					<Box
						className={classes.cardIcon}
						aria-hidden
					>
						<IntegrationGlyph
							meta={meta}
							size={74}
						/>
					</Box>
				)}
				<Stack
					h="100%"
					justify="space-between"
					gap={0}
					pos="relative"
					style={{ zIndex: 1 }}
				>
					<Text
						fw={600}
						fz="lg"
						c="bright"
					>
						{meta.label}
					</Text>
					<Text
						fz="xs"
						c="slate"
					>
						Coming soon
					</Text>
				</Stack>
			</Paper>
		);
	}

	const card = (
		<Paper
			p="lg"
			radius="md"
			className={classes.card}
			withBorder
		>
			<Box
				className={classes.cardIcon}
				aria-hidden
			>
				<IntegrationGlyph
					meta={meta}
					size={74}
				/>
			</Box>
			<Stack
				h="100%"
				justify="space-between"
				gap={0}
				pos="relative"
				style={{ zIndex: 1 }}
			>
				<Text
					fw={600}
					fz="lg"
					c="bright"
				>
					{meta.label}
				</Text>
				{hasSteps && (
					<Group
						gap="xs"
						fz="xs"
					>
						{meta.connect}
						<Icon path={iconArrowRight} />
					</Group>
				)}
			</Stack>
		</Paper>
	);

	if (!hasSteps) {
		return <Box style={{ pointerEvents: "none" }}>{card}</Box>;
	}

	return (
		<HoverGlow>
			<UnstyledButton
				w="100%"
				onClick={() => onSelect(id)}
			>
				{card}
			</UnstyledButton>
		</HoverGlow>
	);
}

interface IntegrationStepsProps {
	steps: IntegrationStep[];
	active: number;
	onActivate: (index: number) => void;
	onApiKeys: () => void;
}

/** "Get API key" call-to-action, embedded in step markdown as `<ApiKey />`. */
function ApiKeyButton({ onClick }: { onClick: () => void }) {
	return (
		<Button
			variant="gradient"
			rightSection={<Icon path={iconArrowUpRight} />}
			onClick={onClick}
		>
			Get API key
		</Button>
	);
}

/** "Read the documentation" call-to-action, embedded as `<Documentation href="…" />`. */
function DocumentationButton({ href }: { href?: string }) {
	return (
		<Button
			variant="gradient"
			rightSection={<Icon path={iconArrowUpRight} />}
			onClick={() => adapter.openUrl(href ?? DOCS_FALLBACK)}
		>
			Read the documentation
		</Button>
	);
}

function IntegrationSteps({ steps, active, onActivate, onApiKeys }: IntegrationStepsProps) {
	const components = useMemo<MarkdownComponents>(
		() => ({
			ApiKey: () => <ApiKeyButton onClick={onApiKeys} />,
			Documentation: DocumentationButton,
		}),
		[onApiKeys],
	);

	return (
		<Timeline
			bulletSize={26}
			lineWidth={2}
			styles={{
				itemBullet: {
					backgroundColor: "var(--mantine-color-obsidian-5)",
					color: "var(--mantine-color-white)",
					border: "none",
					fontSize: "12px",
					fontWeight: 700,
				},
				item: {
					"--item-border-color": "var(--mantine-color-obsidian-6)",
				},
			}}
		>
			{steps.map((step, idx) => {
				const isActive = active === idx;
				const isLast = idx === steps.length - 1;

				return (
					<Timeline.Item
						key={idx}
						bullet={idx + 1}
						title={
							<UnstyledButton
								w="100%"
								onClick={() => onActivate(idx)}
								style={{ textAlign: "left" }}
							>
								<Text
									fw={isActive ? 600 : 500}
									c={isActive ? "bright" : "slate"}
								>
									{step.title}
								</Text>
							</UnstyledButton>
						}
					>
						<Collapse expanded={isActive}>
							<Box pt="xs">
								<MarkdownViewer
									content={step.description}
									components={components}
								/>
								{!isLast && (
									<UnstyledButton
										onClick={() => onActivate(idx + 1)}
										display="block"
										variant="transparent"
									>
										<Group
											gap="xs"
											mt="md"
											c="var(--surreal-passion)"
										>
											<Text>Continue to next step</Text>
											<Icon path={iconArrowRight} />
										</Group>
									</UnstyledButton>
								)}
							</Box>
						</Collapse>
					</Timeline.Item>
				);
			})}
		</Timeline>
	);
}

export default function IntegrationView({ context }: ContextViewProps) {
	const search = useSearchParams();
	const idFromSearch = search.integration;
	const navigateContext = useContextNavigator();

	const integrationSteps = useMemo(() => buildIntegrationSteps(context), [context]);

	const canOpen = (id: string | undefined): id is IntegrationId =>
		isIntegrationId(id) &&
		!INTEGRATION_META[id].comingSoon &&
		(integrationSteps[id]?.length ?? 0) > 0;

	const [selected, setSelected] = useState<IntegrationId | null>(() =>
		canOpen(idFromSearch) ? idFromSearch : null,
	);
	const [activeStep, setActiveStep] = useState(0);

	// Deep-link support: open the modal when arriving with an `?integration=` param.
	useEffect(() => {
		if (
			isIntegrationId(idFromSearch) &&
			!INTEGRATION_META[idFromSearch].comingSoon &&
			(integrationSteps[idFromSearch]?.length ?? 0) > 0
		) {
			setSelected(idFromSearch);
		}
	}, [idFromSearch, integrationSteps]);

	const openIntegration = (id: IntegrationId) => {
		setActiveStep(0);
		setSelected(id);
	};

	const closeIntegration = () => {
		setSelected(null);
	};

	const goToApiKeys = () => {
		closeIntegration();
		navigateContext(context.organization_id, context.id, "api-keys");
	};

	const selectedMeta = selected ? INTEGRATION_META[selected] : null;
	const selectedSteps = (selected ? integrationSteps[selected] : []) ?? [];

	return (
		<Stack gap={48}>
			<ContextHero
				kicker="Quick start"
				title="Connect to your context"
				description="Wire this context into your agent, whether that's through our SDKs, the REST API and CLI, MCP-native coding tools, or the framework and automation platform of your choice."
				art={pictoIntegrationsGradient}
			/>

			{INTEGRATION_CATEGORIES.map((category) => (
				<Box key={category.title}>
					<Title
						order={2}
						fz="xl"
						c="bright"
					>
						{category.title}
					</Title>
					<Text
						mt={4}
						c="slate"
					>
						{category.description}
					</Text>
					<SimpleGrid
						mt="lg"
						cols={{ base: 2, sm: 3, md: 4, lg: 5 }}
						spacing="lg"
					>
						{category.integrations.map((id) => (
							<IntegrationCard
								key={id}
								id={id}
								hasSteps={(integrationSteps[id]?.length ?? 0) > 0}
								onSelect={openIntegration}
							/>
						))}
					</SimpleGrid>
				</Box>
			))}

			<Modal
				opened={selected !== null}
				onClose={closeIntegration}
				size="lg"
				title={
					selectedMeta && (
						<Group
							gap="sm"
							wrap="nowrap"
							pt="lg"
							pb="xl"
						>
							<IntegrationGlyph
								meta={selectedMeta}
								size={28}
							/>
							<Box>
								<Text
									fw={600}
									fz="lg"
									c="bright"
								>
									Connect {selectedMeta.label}
								</Text>
								<Text
									fz="sm"
									c="slate"
								>
									Step {activeStep + 1} of {selectedSteps.length}
								</Text>
							</Box>
						</Group>
					)
				}
			>
				{selected && (
					<IntegrationSteps
						steps={selectedSteps}
						active={activeStep}
						onActivate={setActiveStep}
						onApiKeys={goToApiKeys}
					/>
				)}
			</Modal>
		</Stack>
	);
}
