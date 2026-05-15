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

interface KnowledgeExample {
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

function buildExamples(context: CloudContext): KnowledgeExample[] {
	const restRoot = `https://${context.host}/api/v1/${context.id}`;

	return [
		{
			title: "Upload a document",
			description:
				"Send a file to Layer 0 knowledge. Spectron normalises, chunks, embeds, and indexes it so the agent can ground answers in your source material.",
			snippets: {
				python: {
					lang: "python",
					code: `doc = client.knowledge.upload(
    file="handbook.md",
    title="Company handbook",
    mime_type="text/markdown",
)`,
				},
				javascript: {
					lang: "javascript",
					code: `const file = new TextEncoder().encode("# Company handbook\\n...");

const doc = await client.knowledge.upload({
    file,
    title: "Company handbook",
    filename: "handbook.md",
    mimeType: "text/markdown",
});`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/knowledge \\
    -H "API-KEY: your-api-key" \\
    -F 'metadata={"title":"Company handbook","mimeType":"text/markdown"}' \\
    -F "file=@./handbook.md;type=text/markdown"`,
				},
			},
		},
		{
			title: "Add typed nodes",
			description:
				"Create structured concepts and relations alongside your documents. Typed nodes power graph queries and let agents reason over your domain, not just text.",
			snippets: {
				python: {
					lang: "python",
					code: `from surrealdb.spectron import KnowledgeNodeUpsertRow

client.knowledge.nodes.upsert(
    nodes=[
        KnowledgeNodeUpsertRow(
            kind="product",
            slug="airpods_pro_2",
            title="AirPods Pro 2",
            content={"price": 249, "category": "Audio"},
        ),
    ],
)`,
				},
				javascript: {
					lang: "javascript",
					code: `await client.knowledge.nodes.upsert({
    nodes: [
        {
            kind: "product",
            slug: "airpods_pro_2",
            title: "AirPods Pro 2",
            content: { price: 249, category: "Audio" },
            links: [],
        },
    ],
});`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/knowledge/nodes/batch \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '[{"kind":"product","slug":"airpods_pro_2","title":"AirPods Pro 2","content":{"price":249,"category":"Audio"},"links":[]}]'`,
				},
			},
		},
		{
			title: "Hybrid search",
			description:
				"Issue a single query that combines vector similarity, BM25, and graph signals across documents and typed nodes — ranked and returned in one round-trip.",
			snippets: {
				python: {
					lang: "python",
					code: `from surrealdb import SpectronQueryMode

results = client.knowledge.query(
    "What is the return policy?",
    mode=SpectronQueryMode.HYBRID,
    k=8,
)`,
				},
				javascript: {
					lang: "javascript",
					code: `import { QueryMode } from "@surrealdb/spectron";

const results = await client.knowledge.query({
    query: "What is the return policy?",
    mode: QueryMode.hybrid,
    k: 8,
});`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/knowledge/query \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"query":"What is the return policy?","mode":"hybrid","k":8}'`,
				},
			},
		},
		{
			title: "Traverse the graph",
			description:
				"Walk the typed-node graph from a starting point along named edges. Use this for lineage, peer lookup, or exploring how concepts relate beyond what search alone can surface.",
			snippets: {
				python: {
					lang: "python",
					code: `from surrealdb.spectron import TraverseStartJson

results = client.knowledge.traverse(
    start=[TraverseStartJson(type="node", kind="product", slug="airpods_pro_2")],
    edges=["covered_by"],
    max_depth=2,
)`,
				},
				javascript: {
					lang: "javascript",
					code: `const results = await client.knowledge.traverse({
    start: [{ type: "node", kind: "product", slug: "airpods_pro_2" }],
    edges: ["covered_by"],
    maxDepth: 2,
});`,
				},
				api: {
					lang: "bash",
					code: `curl -X POST ${restRoot}/knowledge/traverse \\
    -H "API-KEY: your-api-key" \\
    -H "Content-Type: application/json" \\
    -d '{"start":[{"type":"node","kind":"product","slug":"airpods_pro_2"}],"edges":["covered_by"],"maxDepth":2}'`,
				},
			},
		},
	];
}

interface KnowledgeExamplesProps {
	context: CloudContext;
}

export function KnowledgeExamples({ context }: KnowledgeExamplesProps) {
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
				kicker="Ingest"
				order={2}
			>
				Knowledge
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
