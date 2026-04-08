import { Badge, Group, Paper, Text, ThemeIcon, useMantineTheme } from "@mantine/core";
import { Icon, iconRelation } from "@surrealdb/ui";
import { useEffect, useMemo, useRef } from "react";
import { RecordId } from "surrealdb";
import { useCloudContextKnowledgeQuery, useCloudContextStatsQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { newRelationalGraph, RelationGraph } from "~/components/RelationGraph";
import type { GraphEdges } from "~/components/RelationGraph/types";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { ContextViewProps } from "../../types";

const TYPE_COLORS: Record<string, string> = {
	person: "blue",
	city: "green",
	company: "violet",
	technology: "orange",
	food: "teal",
	preference: "pink",
	agent: "grape",
	topic: "cyan",
};

export default function KnowledgeView({ context }: ContextViewProps) {
	const { data: knowledge } = useCloudContextKnowledgeQuery(context.id);
	const { data: stats } = useCloudContextStatsQuery(context.id);
	const theme = useMantineTheme();
	const graphBuilt = useRef(false);

	const graph = useMemo(() => newRelationalGraph(), []);

	useEffect(() => {
		if (!knowledge || graphBuilt.current) return;
		graphBuilt.current = true;

		const nodeMap = new Map<string, string>();

		for (const node of knowledge.nodes) {
			const record = new RecordId(node.type, node.id);
			const id = record.toString();
			const color = theme.colors[TYPE_COLORS[node.type] ?? "gray"][6];

			nodeMap.set(node.label, id);

			const angle = Math.random() * 2 * Math.PI;
			const radius = 50 + Math.random() * 150;

			graph.addNode(id, {
				record,
				label: node.label,
				x: Math.cos(angle) * radius,
				y: Math.sin(angle) * radius,
				size: 8 + node.memoryCount * 1.5,
				color,
			});
		}

		for (const rel of knowledge.relations) {
			const sourceId = nodeMap.get(rel.source);
			const targetId = nodeMap.get(rel.target);

			if (!sourceId || !targetId) continue;
			if (sourceId === targetId) continue;

			const record = new RecordId(rel.relationship, `${rel.source}_${rel.target}`);

			graph.addEdge(sourceId, targetId, {
				record,
				label: rel.relationship,
				weight: 1,
				size: 2,
				type: "curved",
			});
		}
	}, [knowledge, graph, theme.colors]);

	const queryEdges = useStable((_record: RecordId): GraphEdges => {
		return { from: new Set(), to: new Set() };
	});

	const entityTypes = useMemo(() => {
		if (!knowledge) return [];
		const types = new Set(knowledge.nodes.map((n) => n.type));
		return Array.from(types).sort();
	}, [knowledge]);

	return (
		<>
			<PrimaryTitle fz={32}>Knowledge Graph</PrimaryTitle>

			<Section title="Overview">
				<Group gap="lg">
					<Paper
						p="sm"
						px="md"
					>
						<Group gap="xs">
							<ThemeIcon
								variant="light"
								color="blue"
								size="sm"
							>
								<Icon path={iconRelation} />
							</ThemeIcon>
							<Text fw={600}>{stats?.totalKnowledgeNodes ?? 0} nodes</Text>
						</Group>
					</Paper>
					<Paper
						p="sm"
						px="md"
					>
						<Group gap="xs">
							<ThemeIcon
								variant="light"
								color="teal"
								size="sm"
							>
								<Icon path={iconRelation} />
							</ThemeIcon>
							<Text fw={600}>{stats?.totalKnowledgeRelations ?? 0} relations</Text>
						</Group>
					</Paper>
					<Paper
						p="sm"
						px="md"
					>
						<Group gap="xs">
							<Text fw={600}>{entityTypes.length} entity types</Text>
						</Group>
					</Paper>
					<Paper
						p="sm"
						px="md"
					>
						<Badge
							variant="light"
							color={stats?.graphEnabled ? "green" : "gray"}
						>
							Graph {stats?.graphEnabled ? "enabled" : "disabled"}
						</Badge>
					</Paper>
				</Group>
			</Section>

			<Paper>
				<RelationGraph
					graph={graph}
					queryEdges={queryEdges}
					h={500}
					style={{ borderRadius: "var(--mantine-radius-md)" }}
				/>
			</Paper>
		</>
	);
}
