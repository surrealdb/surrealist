import {
	Box,
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
import { brandJavaScript, brandPython, CodeBlock, Header, Icon, iconAPI } from "@surrealdb/ui";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "~/hooks/routing";
import type { CloudContext } from "~/types";
import classes from "./style.module.scss";

type ExampleTab = "python" | "javascript" | "api";

interface ExampleSnippet {
	lang: string;
	code: string;
}

interface MemoryExample {
	title: string;
	description: string;
	snippets: Record<ExampleTab, ExampleSnippet>;
}

const LANGUAGES: Record<ExampleTab, { label: string; img?: string; icon?: string }> = {
	python: { label: "Python", img: brandPython },
	javascript: { label: "JavaScript", img: brandJavaScript },
	api: { label: "REST API", icon: iconAPI },
};

function isExampleTab(value: string | undefined): value is ExampleTab {
	return value === "python" || value === "javascript" || value === "api";
}

function buildExamples(context: CloudContext): MemoryExample[] {
	const restRoot = `https://${context.host}/api/v1/${context.id}`;

	return [
		{
			title: "Capture a memory",
			description:
				"Open a session scoped to a user and record a conversation turn. Spectron extracts entities, attributes, and relations on every turn so the memory graph grows automatically.",
			snippets: {
				python: {
					lang: "python",
					code: `from surrealdb import SpectronTurnRole

session = client.sessions.create(scope={"user": "alex"})
session.turn(SpectronTurnRole.USER, "I prefer dark mode in the app.")`,
				},
				javascript: {
					lang: "javascript",
					code: `import { TurnRole } from "@surrealdb/spectron";

const session = await client.sessions.create({
    scope: { user: "alex" },
});

await session.turn({ role: TurnRole.user, content: "I prefer dark mode in the app." });`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/sessions/$SESSION_ID/turns \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"role":"user","content":"I prefer dark mode in the app."}'`,
				},
			},
		},
		{
			title: "Recall a memory",
			description:
				"Run a hybrid query across the memory graph that blends vector similarity with structured filters, returning the most relevant memories ranked for the agent.",
			snippets: {
				python: {
					lang: "python",
					code: `results = client.query("What does the user prefer?", k=10)

for hit in results.hits:
    print(hit.score, hit.text)`,
				},
				javascript: {
					lang: "javascript",
					code: `const results = await client.query({
    query: "What does the user prefer?",
    k: 10,
});`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/query \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"query":"What does the user prefer?","k":10}'`,
				},
			},
		},
		{
			title: "Build context for an LLM",
			description:
				"Render a ready-to-paste context string for prompt injection. Spectron blends recent turns, structured facts, and relevant entities into a single, compact block.",
			snippets: {
				python: {
					lang: "python",
					code: `result = client.context("What does the user prefer?", k=10)

print(result.context)`,
				},
				javascript: {
					lang: "javascript",
					code: `const result = await client.context({
    query: "What does the user prefer?",
    k: 10,
});

console.log(result.context);`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/context \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"query":"What does the user prefer?","k":10}'`,
				},
			},
		},
		{
			title: "Forget a memory",
			description:
				"Soft-delete memories that match a natural-language query. Useful for honouring user requests, redactions, or pruning stale context without rebuilding the graph.",
			snippets: {
				python: {
					lang: "python",
					code: `result = client.forget("user preferences about UI theme")

print(result.deleted)`,
				},
				javascript: {
					lang: "javascript",
					code: `const result = await client.forget({
    query: "user preferences about UI theme",
});

console.log(result.deleted);`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/forget \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"query":"user preferences about UI theme"}'`,
				},
			},
		},
	];
}

interface MemoryExamplesProps {
	context: CloudContext;
}

export function MemoryExamples({ context }: MemoryExamplesProps) {
	const search = useSearchParams();
	const tabFromSearch = search.tab;
	const [activeTab, setActiveTab] = useState<ExampleTab>(() =>
		isExampleTab(tabFromSearch) ? tabFromSearch : "python",
	);

	useEffect(() => {
		if (isExampleTab(tabFromSearch)) {
			setActiveTab(tabFromSearch);
		}
	}, [tabFromSearch]);

	const examples = useMemo(() => buildExamples(context), [context]);

	return (
		<Paper
			p="lg"
			radius="md"
			className={classes.examplesPane}
		>
			<Header
				kicker="Inspect"
				order={2}
			>
				Memories
			</Header>

			<Stack
				gap="lg"
				mt="lg"
			>
				<Tabs
					value={activeTab}
					onChange={(value) => setActiveTab((value as ExampleTab) ?? "python")}
				>
					<Tabs.List>
						{(Object.keys(LANGUAGES) as ExampleTab[]).map((tab) => (
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
					{examples.map((example, idx) => {
						const snippet = example.snippets[activeTab];

						return (
							<Timeline.Item
								key={example.title}
								bullet={idx + 1}
							>
								<SimpleGrid cols={2}>
									<Box>
										<Title
											order={3}
											fz="lg"
										>
											{example.title}
										</Title>
										<Text className="selectable">{example.description}</Text>
									</Box>
									<CodeBlock
										value={snippet.code}
										lang={snippet.lang}
									/>
								</SimpleGrid>
							</Timeline.Item>
						);
					})}
				</Timeline>
			</Stack>
		</Paper>
	);
}
