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
import { buildCodexSteps } from "./integrations/codex";
import { buildDartSteps } from "./integrations/dart";
import { buildElixirSteps } from "./integrations/elixir";
import { buildGolangSteps } from "./integrations/golang";
import { buildHaskellSteps } from "./integrations/haskell";
import { buildKotlinSteps } from "./integrations/kotlin";
import { buildLangChainSteps } from "./integrations/langchain";
import { buildMcpSteps } from "./integrations/mcp";
import { buildN8nSteps } from "./integrations/n8n";
import { buildOpenAiAgentsSteps } from "./integrations/openai-agents";
import { buildSwiftSteps } from "./integrations/swift";
import type { IntegrationStep } from "./integrations/types";
import classes from "./style.module.scss";

function buildIntegrationSteps(context: CloudContext): Record<IntegrationId, IntegrationStep[]> {
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
					Open a session scoped to a user and record conversation turns. Spectron extracts entities, attributes, and relations on every turn so the memory graph grows automatically.

					~~~python
					from surrealdb import SpectronTurnRole

					session = client.sessions.create(scopes=["user/alex"])
					session.turn(SpectronTurnRole.USER, "Hi, I'm Alex. I prefer dark mode.")
					session.turn(SpectronTurnRole.ASSISTANT, "Got it, Alex — noted.")
					~~~
				`),
			},
			{
				title: "Recall with hybrid search",
				description: dedent(`
					Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.

					~~~python
					results = client.query("What are the user's preferences?", k=10)

					for hit in results.hits:
					    print(hit.score, hit.text)
					~~~
				`),
			},
			{
				title: "Explore Spectron",
				description: dedent(`
					Discover the full potential of Spectron with the official documentation.

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
					Open a session scoped to a user and record conversation turns. Spectron extracts entities, attributes, and relations on every turn so the memory graph grows automatically.

					~~~javascript
					import { TurnRole } from "@surrealdb/spectron";

					const session = await client.sessions.create({
					    scopes: ["user/alex"],
					});

					await session.turn({ role: TurnRole.user, content: "Hi, I'm Alex. I prefer dark mode." });
					await session.turn({ role: TurnRole.assistant, content: "Got it, Alex — noted." });
					~~~
				`),
			},
			{
				title: "Recall with hybrid search",
				description: dedent(`
					Run a single query that blends graph traversal, vector similarity, and structured filters, returning the most relevant memories ranked for the agent in one round-trip.

					~~~javascript
					const results = await client.query({
					    query: "What are the user's preferences?",
					    k: 10,
					});
					~~~
				`),
			},
			{
				title: "Explore Spectron",
				description: dedent(`
					Discover the full potential of Spectron with the official documentation.

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
				title: "Open a session",
				description: dedent(`
					Create a session scoped to a user. The response includes an \`id\` you'll pass to subsequent calls when recording turns.

					~~~bash
					curl -X POST ${restRoot}/sessions \\
					    -H "API-KEY: your-api-key" \\
					    -H "Content-Type: application/json" \\
					    -d '{"scopes":["user/alex"]}'
					~~~
				`),
			},
			{
				title: "Capture a memory",
				description: dedent(`
					Record a conversation turn against the session you just created. Replace \`$SESSION_ID\` with the \`id\` returned from the previous call.

					~~~bash
					curl -X POST ${restRoot}/sessions/$SESSION_ID/turns \\
					    -H "API-KEY: your-api-key" \\
					    -H "Content-Type: application/json" \\
					    -d '{"role":"user","content":"Hi, I am Alex. I prefer dark mode."}'
					~~~
				`),
			},
			{
				title: "Recall with hybrid search",
				description: dedent(`
					Issue a natural-language query against your stored memories and let the hybrid retrieval pipeline combine vector similarity with graph traversal behind a single endpoint.

					~~~bash
					curl -X POST ${restRoot}/query \\
					    -H "API-KEY: your-api-key" \\
					    -H "Content-Type: application/json" \\
					    -d '{"query":"What are the user preferences?","k":10}'
					~~~
				`),
			},
			{
				title: "Explore Spectron",
				description: dedent(`
					Discover the full potential of Spectron with the official documentation.

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
		mcp: buildMcpSteps(context),
		n8n: buildN8nSteps(context),
		langchain: buildLangChainSteps(context),
		"openai-agents": buildOpenAiAgentsSteps(context),
	};
}

const DOCS_FALLBACK = "https://surrealdb.com/docs/spectron";

/** Renders a large brand image or a monochrome icon for an integration. */
function IntegrationGlyph({ meta, size }: { meta: IntegrationMeta; size: number }) {
	if (meta.img) {
		return (
			<Image
				src={meta.img}
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
	onSelect: (id: IntegrationId) => void;
}

function IntegrationCard({ id, onSelect }: IntegrationCardProps) {
	const meta = INTEGRATION_META[id];

	return (
		<HoverGlow>
			<UnstyledButton
				w="100%"
				onClick={() => onSelect(id)}
			>
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
						<Group
							gap="xs"
							fz="xs"
						>
							{meta.connect}
							<Icon path={iconArrowRight} />
						</Group>
					</Stack>
				</Paper>
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

	const [selected, setSelected] = useState<IntegrationId | null>(() =>
		isIntegrationId(idFromSearch) ? idFromSearch : null,
	);
	const [activeStep, setActiveStep] = useState(0);

	const integrationSteps = useMemo(() => buildIntegrationSteps(context), [context]);

	// Deep-link support: open the modal when arriving with an `?integration=` param.
	useEffect(() => {
		if (isIntegrationId(idFromSearch)) {
			setSelected(idFromSearch);
		}
	}, [idFromSearch]);

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
	const selectedSteps = selected ? integrationSteps[selected] : [];

	return (
		<Stack gap={48}>
			<ContextHero
				kicker="Quick start"
				title="Connect to your context"
				description="Wire this context into your agent — through the Python, JavaScript, Go, Swift, Kotlin, Haskell, Elixir, and Dart SDKs, the REST API and CLI, MCP-native coding tools, or a framework like LangChain, n8n, and the OpenAI Agents SDK."
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
