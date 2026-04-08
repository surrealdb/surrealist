import { Badge, Paper, SimpleGrid, Table, Text, TextInput } from "@mantine/core";
import { Icon, iconSearch } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { useCloudContextEntitiesQuery, useCloudContextStatsQuery } from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { ContextViewProps } from "../../types";

function formatRelativeTime(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const minutes = Math.floor(diff / 60_000);

	if (minutes < 1) return "Just now";
	if (minutes < 60) return `${minutes}m ago`;

	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;

	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

export default function EntitiesView({ context }: ContextViewProps) {
	const { data: entities } = useCloudContextEntitiesQuery(context.id);
	const { data: stats } = useCloudContextStatsQuery(context.id);
	const [search, setSearch] = useState("");

	const filtered = useMemo(() => {
		if (!entities) return [];
		if (!search) return entities;

		const query = search.toLowerCase();
		return entities.filter(
			(e) => e.name.toLowerCase().includes(query) || e.type.toLowerCase().includes(query),
		);
	}, [entities, search]);

	const totalUsers = stats?.totalUsers ?? 0;
	const totalAgents = stats?.totalAgents ?? 0;

	return (
		<>
			<PrimaryTitle fz={32}>Entities</PrimaryTitle>

			<Section title="Overview">
				<SimpleGrid cols={{ base: 2, sm: 3 }}>
					<Paper p="md">
						<Text
							fw={700}
							fz="xl"
							c="bright"
						>
							{entities?.length ?? 0}
						</Text>
						<Text>Total entities</Text>
					</Paper>
					<Paper p="md">
						<Text
							fw={700}
							fz="xl"
							c="bright"
						>
							{totalUsers}
						</Text>
						<Text>Users</Text>
					</Paper>
					<Paper p="md">
						<Text
							fw={700}
							fz="xl"
							c="bright"
						>
							{totalAgents}
						</Text>
						<Text>Agents</Text>
					</Paper>
				</SimpleGrid>
			</Section>

			<Section
				title="All entities"
				rightSection={
					<TextInput
						placeholder="Search entities..."
						leftSection={<Icon path={iconSearch} />}
						value={search}
						onChange={(e) => setSearch(e.currentTarget.value)}
						w={250}
					/>
				}
			>
				<Table.ScrollContainer minWidth={500}>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Name</Table.Th>
								<Table.Th>Type</Table.Th>
								<Table.Th>Memories</Table.Th>
								<Table.Th>Created</Table.Th>
								<Table.Th>Last updated</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{filtered.map((entity) => (
								<Table.Tr key={entity.id}>
									<Table.Td>
										<Text
											fw={500}
											c="bright"
										>
											{entity.name}
										</Text>
									</Table.Td>
									<Table.Td>
										<Badge
											variant="light"
											size="sm"
											color={entity.type === "agent" ? "violet" : "blue"}
										>
											{entity.type}
										</Badge>
									</Table.Td>
									<Table.Td>
										<Text>{entity.totalMemories}</Text>
									</Table.Td>
									<Table.Td>
										<Text>{formatRelativeTime(entity.createdAt)}</Text>
									</Table.Td>
									<Table.Td>
										<Text>{formatRelativeTime(entity.updatedAt)}</Text>
									</Table.Td>
								</Table.Tr>
							))}
							{filtered.length === 0 && (
								<Table.Tr>
									<Table.Td colSpan={5}>
										<Text
											ta="center"
											py="lg"
										>
											{search
												? "No entities match your search"
												: "No entities found"}
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
