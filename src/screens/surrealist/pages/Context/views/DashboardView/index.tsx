import {
	Badge,
	Group,
	Indicator,
	Paper,
	Progress,
	SimpleGrid,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { Icon, iconChart, iconChat, iconRelation, iconSearch } from "@surrealdb/ui";
import {
	useCloudContextCategoriesQuery,
	useCloudContextEntitiesQuery,
	useCloudContextEventsQuery,
	useCloudContextStatsQuery,
} from "~/cloud/queries/contexts";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import type { ContextEvent, MemoryEventType } from "~/types";
import { ContextViewProps } from "../../types";

const GRID_COLUMNS = { base: 1, sm: 2, lg: 3 };

const EVENT_COLORS: Record<MemoryEventType, string> = {
	ADD: "green",
	UPDATE: "blue",
	DELETE: "red",
	NOOP: "gray",
};

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

function EventStatusIndicator({ event }: { event: ContextEvent }) {
	switch (event.status) {
		case "SUCCEEDED":
			return (
				<Indicator
					color="green"
					size={8}
					processing={false}
				>
					<Text size="sm">Succeeded</Text>
				</Indicator>
			);
		case "FAILED":
			return (
				<Indicator
					color="red"
					size={8}
					processing={false}
				>
					<Text size="sm">Failed</Text>
				</Indicator>
			);
		case "PENDING":
			return (
				<Indicator
					color="yellow"
					size={8}
					processing
				>
					<Text size="sm">Pending</Text>
				</Indicator>
			);
		case "RUNNING":
			return (
				<Indicator
					color="blue"
					size={8}
					processing
				>
					<Text size="sm">Running</Text>
				</Indicator>
			);
	}
}

function StatCard({
	icon,
	label,
	value,
	subtitle,
	color,
}: {
	icon: string;
	label: string;
	value: string | number;
	subtitle?: string;
	color: string;
}) {
	return (
		<Paper p="lg">
			<Group
				gap="md"
				wrap="nowrap"
			>
				<ThemeIcon
					color={color}
					variant="light"
					size="xl"
				>
					<Icon
						size="lg"
						path={icon}
					/>
				</ThemeIcon>
				<Stack gap={2}>
					<Text
						fw={700}
						fz="xl"
						c="bright"
					>
						{value}
					</Text>
					<Text size="sm">{label}</Text>
					{subtitle && (
						<Text
							size="xs"
							c="dimmed"
						>
							{subtitle}
						</Text>
					)}
				</Stack>
			</Group>
		</Paper>
	);
}

export default function DashboardView({ context }: ContextViewProps) {
	const { data: stats } = useCloudContextStatsQuery(context.id);
	const { data: events } = useCloudContextEventsQuery(context.id);
	const { data: categories } = useCloudContextCategoriesQuery(context.id);
	const { data: entities } = useCloudContextEntitiesQuery(context.id);

	const totalCategories = categories?.reduce((sum, c) => sum + c.count, 0) ?? 0;

	return (
		<>
			<PrimaryTitle fz={32}>{context.name}</PrimaryTitle>

			<Section title="Overview">
				<SimpleGrid cols={GRID_COLUMNS}>
					<StatCard
						icon={iconChat}
						label="Total memories"
						value={stats?.totalMemories ?? 0}
						subtitle={`${stats?.memoriesAddedToday ?? 0} added today`}
						color="blue"
					/>
					<StatCard
						icon={iconSearch}
						label="Searches today"
						value={stats?.searchesToday ?? 0}
						subtitle={`${stats?.avgSearchLatencyMs ?? 0}ms avg latency`}
						color="violet"
					/>
					<StatCard
						icon={iconRelation}
						label="Knowledge nodes"
						value={stats?.totalKnowledgeNodes ?? 0}
						subtitle={`${stats?.totalKnowledgeRelations ?? 0} relations`}
						color="teal"
					/>
					<StatCard
						icon={iconChart}
						label="Users / Agents"
						value={`${stats?.totalUsers ?? 0} / ${stats?.totalAgents ?? 0}`}
						color="orange"
					/>
					<StatCard
						icon={iconSearch}
						label="Avg search latency"
						value={`${stats?.avgSearchLatencyMs ?? 0}ms`}
						color="grape"
					/>
					<StatCard
						icon={iconRelation}
						label="Graph memory"
						value={stats?.graphEnabled ? "Enabled" : "Disabled"}
						color={stats?.graphEnabled ? "green" : "gray"}
					/>
				</SimpleGrid>
			</Section>

			<Section title="Recent events">
				<Table.ScrollContainer minWidth={700}>
					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Event</Table.Th>
								<Table.Th>Memory</Table.Th>
								<Table.Th>Entity</Table.Th>
								<Table.Th>Status</Table.Th>
								<Table.Th>Latency</Table.Th>
								<Table.Th>Time</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{events?.slice(0, 10).map((event) => (
								<Table.Tr key={event.id}>
									<Table.Td>
										<Badge
											color={EVENT_COLORS[event.eventType]}
											variant="light"
											size="sm"
										>
											{event.eventType}
										</Badge>
									</Table.Td>
									<Table.Td maw={250}>
										<Text
											size="sm"
											truncate
										>
											{event.memoryText}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text size="sm">{event.userId}</Text>
									</Table.Td>
									<Table.Td>
										<EventStatusIndicator event={event} />
									</Table.Td>
									<Table.Td>
										<Text size="sm">
											{event.latency > 0 ? `${event.latency}ms` : "—"}
										</Text>
									</Table.Td>
									<Table.Td>
										<Text
											size="sm"
											c="dimmed"
										>
											{formatRelativeTime(event.createdAt)}
										</Text>
									</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</Table.ScrollContainer>
			</Section>

			<Section title="Category distribution">
				<Stack gap="sm">
					{categories
						?.slice()
						.sort((a, b) => b.count - a.count)
						.map((category) => (
							<Paper
								key={category.name}
								p="sm"
							>
								<Group
									justify="space-between"
									mb={4}
								>
									<Text
										size="sm"
										fw={500}
									>
										{category.name}
									</Text>
									<Text
										size="sm"
										c="dimmed"
									>
										{category.count}
									</Text>
								</Group>
								<Progress
									value={
										totalCategories > 0
											? (category.count / totalCategories) * 100
											: 0
									}
									size="sm"
								/>
							</Paper>
						))}
				</Stack>
			</Section>

			<Section title="Entities">
				<Table>
					<Table.Thead>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Type</Table.Th>
							<Table.Th>Memories</Table.Th>
							<Table.Th>Last updated</Table.Th>
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{entities?.map((entity) => (
							<Table.Tr key={entity.id}>
								<Table.Td>
									<Text
										size="sm"
										fw={500}
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
									<Text size="sm">{entity.totalMemories}</Text>
								</Table.Td>
								<Table.Td>
									<Text
										size="sm"
										c="dimmed"
									>
										{formatRelativeTime(entity.updatedAt)}
									</Text>
								</Table.Td>
							</Table.Tr>
						))}
					</Table.Tbody>
				</Table>
			</Section>
		</>
	);
}
