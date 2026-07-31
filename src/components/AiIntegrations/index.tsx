import {
	Anchor,
	Box,
	Button,
	Divider,
	Group,
	Image,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Title,
} from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconOpen,
	pictoLangChainGradient,
	pictoLearnGradient,
	pictoSidekickGradient,
	pictoSpectronGradient,
	pictoSurrealMCPGradient,
} from "@surrealdb/ui";
import { adapter } from "~/adapter";
import glowImg from "~/assets/images/radial-glow.png";
import { Spacer } from "~/components/Spacer";
import classes from "./style.module.scss";

const AI_DOCS_URL = "https://surrealdb.com/docs/build/ai-agents";
const INTEGRATIONS_URL = "https://surrealdb.com/docs/build/integrations";

const ROUTES = [
	{
		name: "Surreal MCP Server",
		description:
			"Point Claude, Cursor, or any MCP client at a single URL to query your data and manage instances.",
		image: pictoSurrealMCPGradient,
		url: "https://surrealdb.com/docs/build/ai-agents/mcp",
	},
	{
		name: "Agent Skills",
		description:
			"Install packaged SurrealQL, vector search, and Python knowledge into your coding agent.",
		image: pictoLearnGradient,
		url: "https://surrealdb.com/docs/build/ai-agents/agent-skills",
	},
	{
		name: "AI frameworks",
		description:
			"Build agents on SurrealDB with LangChain, LlamaIndex, CrewAI, PydanticAI, and Agno.",
		image: pictoLangChainGradient,
		url: "https://surrealdb.com/docs/build/ai-agents/ai-frameworks",
	},
	{
		name: "Spectron",
		description:
			"A memory and knowledge layer for agents, with provenance and history built in. Join the waitlist.",
		image: pictoSpectronGradient,
		url: "https://surrealdb.com/spectron/get-started",
	},
];

export interface AiIntegrationsProps {
	inline?: boolean;
	rightSection?: React.ReactNode;
}

export function AiIntegrations({ inline, rightSection }: AiIntegrationsProps) {
	return (
		<Stack
			gap={0}
			h="100%"
			w="100%"
			style={{ overflow: "hidden" }}
		>
			{!inline && (
				<>
					<Group
						p="lg"
						wrap="nowrap"
					>
						<Image
							src={pictoSidekickGradient}
							w={36}
							h={36}
							alt=""
						/>
						<Box miw={0}>
							<Text
								fz="lg"
								fw={700}
								c="bright"
							>
								Using SurrealDB with AI
							</Text>
							<Text
								fz="sm"
								truncate
							>
								Supercharge your agents with SurrealDB
							</Text>
						</Box>
						<Spacer />
						{rightSection}
					</Group>
					<Divider />
				</>
			)}
			<Box
				flex={1}
				pos="relative"
				style={{ overflow: "hidden" }}
			>
				<Image
					pos="absolute"
					src={glowImg}
					left={-200}
					bottom={-300}
					opacity={0.5}
					alt=""
					style={{ transform: "scale(2)" }}
				/>
				<ScrollArea
					pos="absolute"
					type="scroll"
					inset={0}
				>
					<Stack
						p="xl"
						align="center"
						maw={520}
						mx="auto"
					>
						<Image
							src={pictoSidekickGradient}
							w={55}
							h={55}
							mt="xl"
							alt=""
							className={classes.notice}
							__vars={{ "--notice-delay": "0ms" }}
						/>
						<Title
							order={2}
							ta="center"
							mt="lg"
							className={classes.notice}
							__vars={{ "--notice-delay": "60ms" }}
						>
							Using SurrealDB with AI
						</Title>
						<Text
							ta="center"
							className={classes.notice}
							__vars={{ "--notice-delay": "120ms" }}
						>
							SurrealDB can be plugged straight into the AI tools you already use.
							Teach your agent SurrealQL, learn about SurrealDB, or have your agent
							manage your data for you.
						</Text>

						<Text
							fz={11}
							fw={600}
							mt="xl"
							w="100%"
							tt="uppercase"
							className={classes.notice}
							__vars={{ "--notice-delay": "180ms" }}
							style={{ letterSpacing: "0.08em" }}
						>
							Ways to connect
						</Text>
						<Stack
							w="100%"
							gap="sm"
						>
							{ROUTES.map((route, index) => (
								<Anchor
									key={route.name}
									variant="glow"
									href={route.url}
									className={classes.notice}
									__vars={{ "--notice-delay": `${240 + index * 60}ms` }}
									onClick={(event) => {
										event.preventDefault();
										adapter.openUrl(route.url);
									}}
								>
									<Paper
										p="lg"
										radius="xs"
									>
										<Group
											wrap="nowrap"
											gap="lg"
										>
											<Image
												src={route.image}
												w={38}
												h={38}
												alt=""
											/>
											<Box>
												<Text
													c="bright"
													fw={600}
													fz="lg"
												>
													{route.name}
												</Text>
												<Text
													mt="xs"
													fz="xs"
												>
													{route.description}
												</Text>
											</Box>
											<Spacer />
											<Icon
												path={iconArrowUpRight}
												className={classes.routeArrow}
											/>
										</Group>
									</Paper>
								</Anchor>
							))}
						</Stack>

						<Group
							mt="xl"
							w="100%"
							wrap="nowrap"
							className={classes.notice}
							__vars={{ "--notice-delay": "480ms" }}
						>
							<Button
								flex={1}
								variant="gradient"
								rightSection={<Icon path={iconOpen} />}
								onClick={() => adapter.openUrl(AI_DOCS_URL)}
							>
								Read the AI docs
							</Button>
							<Button
								flex={1}
								color="obsidian"
								variant="light"
								rightSection={<Icon path={iconOpen} />}
								onClick={() => adapter.openUrl(INTEGRATIONS_URL)}
							>
								Browse integrations
							</Button>
						</Group>
					</Stack>
				</ScrollArea>
			</Box>
		</Stack>
	);
}
