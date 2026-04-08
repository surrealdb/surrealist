import {
	Badge,
	Chip,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { Icon, iconRelation } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { useCloudContextKnowledgeQuery, useCloudContextStatsQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
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

	const [typeFilter, setTypeFilter] = useState("all");
	const [selectedNode, setSelectedNode] = useState<string | null>(null);

	const entityTypes = useMemo(() => {
		if (!knowledge) return [];
		const types = new Set(knowledge.nodes.map((n) => n.type));
		return Array.from(types).sort();
	}, [knowledge]);

	const filteredNodes = useMemo(() => {
		if (!knowledge) return [];
		if (typeFilter === "all") return knowledge.nodes;
		return knowledge.nodes.filter((n) => n.type === typeFilter);
	}, [knowledge, typeFilter]);

	const filteredRelations = useMemo(() => {
		if (!knowledge) return [];

		let result = knowledge.relations;

		if (typeFilter !== "all") {
			result = result.filter(
				(r) => r.sourceType === typeFilter || r.targetType === typeFilter,
			);
		}

		if (selectedNode) {
			result = result.filter((r) => r.source === selectedNode || r.target === selectedNode);
		}

		return result;
	}, [knowledge, typeFilter, selectedNode]);

	return (
		<>
			<PrimaryTitle fz={32}>Knowledge</PrimaryTitle>

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
							<Text
								fw={600}
								size="sm"
							>
								{stats?.totalKnowledgeNodes ?? 0} nodes
							</Text>
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
							<Text
								fw={600}
								size="sm"
							>
								{stats?.totalKnowledgeRelations ?? 0} relations
							</Text>
						</Group>
					</Paper>
					<Paper
						p="sm"
						px="md"
					>
						<Group gap="xs">
							<Text
								fw={600}
								size="sm"
							>
								{entityTypes.length} entity types
							</Text>
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

			<Chip.Group
				multiple={false}
				value={typeFilter}
				onChange={(v) => {
					setTypeFilter(v as string);
					setSelectedNode(null);
				}}
			>
				<Group gap="xs">
					<Chip
						value="all"
						size="xs"
					>
						All types
					</Chip>
					{entityTypes.map((type) => (
						<Chip
							key={type}
							value={type}
							size="xs"
							color={TYPE_COLORS[type] ?? "gray"}
						>
							{type}
						</Chip>
					))}
				</Group>
			</Chip.Group>

			<Section title="Entities">
				<SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }}>
					{filteredNodes.map((node) => (
						<Paper
							key={node.id}
							p="sm"
							withBorder={selectedNode === node.label}
							style={{
								cursor: "pointer",
								borderColor:
									selectedNode === node.label
										? `var(--mantine-color-${TYPE_COLORS[node.type] ?? "gray"}-6)`
										: undefined,
							}}
							onClick={() =>
								setSelectedNode(selectedNode === node.label ? null : node.label)
							}
						>
							<Stack gap={4}>
								<Text
									fw={600}
									size="sm"
									c="bright"
								>
									{node.label}
								</Text>
								<Group
									gap="xs"
									justify="space-between"
								>
									<Badge
										variant="light"
										size="xs"
										color={TYPE_COLORS[node.type] ?? "gray"}
									>
										{node.type}
									</Badge>
									<Text
										size="xs"
										c="dimmed"
									>
										{node.memoryCount} memories
									</Text>
								</Group>
							</Stack>
						</Paper>
					))}
				</SimpleGrid>
			</Section>

			<Section
				title="Relations"
				description={
					selectedNode ? `Showing relations involving "${selectedNode}"` : undefined
				}
				rightSection={
					selectedNode ? (
						<Badge
							variant="light"
							onClick={() => setSelectedNode(null)}
							style={{ cursor: "pointer" }}
						>
							Clear filter
						</Badge>
					) : undefined
				}
			>
				<Table.ScrollContainer minWidth={600}>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Source</Table.Th>
								<Table.Th>Relationship</Table.Th>
								<Table.Th>Target</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{filteredRelations.map((rel, i) => (
								<Table.Tr
									key={`${rel.source}-${rel.relationship}-${rel.target}-${i}`}
								>
									<Table.Td>
										<Group
											gap="xs"
											wrap="nowrap"
										>
											<Badge
												variant="light"
												size="xs"
												color={TYPE_COLORS[rel.sourceType] ?? "gray"}
											>
												{rel.sourceType}
											</Badge>
											<Text size="sm">{rel.source}</Text>
										</Group>
									</Table.Td>
									<Table.Td>
										<Text
											size="sm"
											fw={500}
											c="dimmed"
										>
											{rel.relationship}
										</Text>
									</Table.Td>
									<Table.Td>
										<Group
											gap="xs"
											wrap="nowrap"
										>
											<Badge
												variant="light"
												size="xs"
												color={TYPE_COLORS[rel.targetType] ?? "gray"}
											>
												{rel.targetType}
											</Badge>
											<Text size="sm">{rel.target}</Text>
										</Group>
									</Table.Td>
								</Table.Tr>
							))}
							{filteredRelations.length === 0 && (
								<Table.Tr>
									<Table.Td colSpan={3}>
										<Text
											ta="center"
											c="dimmed"
											py="lg"
										>
											No relations found
										</Text>
									</Table.Td>
								</Table.Tr>
							)}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Section>
		</>
	);
}
