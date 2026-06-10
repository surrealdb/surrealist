import {
	ActionIcon,
	Badge,
	Box,
	Center,
	Divider,
	Drawer,
	Grid,
	Group,
	Loader,
	Paper,
	ScrollArea,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Tabs,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Spectron } from "@surrealdb/spectron";
import { ScopeError } from "@surrealdb/spectron";
import {
	Icon,
	iconChevronRight,
	iconClock,
	iconHistory,
	iconList,
	iconMemory,
	iconRelation,
	iconSearch,
	iconTag,
	iconWarning,
	pictoBrain,
} from "@surrealdb/ui";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useMemo, useState } from "react";
import { ContextHero } from "../../components/ContextHero";
import { EmptyState, PageError, PageLoading, SpectronGate } from "../../components/feedback";
import type { ContextViewProps } from "../../types";
import classes from "./style.module.scss";

// ─── Shared types (inferred from the Spectron SDK) ───

type StateResponse = Awaited<ReturnType<Spectron["state"]>>;
type ProfileResponse = Awaited<ReturnType<Spectron["profile"]>>;
type CategoryState = StateResponse["identity"];
type EntityDetail = StateResponse["identity"]["entities"][number];
type AttributeDetail = StateResponse["identity"]["attributes"][number];
type RelationDetail = StateResponse["identity"]["relations"][number];
type MemoryCategory = EntityDetail["memoryCategory"];

const CATEGORY_COLOR: Record<MemoryCategory, string> = {
	identity: "violet",
	knowledge: "blue",
	context: "teal",
};

/** Friendly relative timestamp; falls back to the raw string when unparseable. */
function relativeTime(value?: string | null): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return formatDistanceToNow(date, { addSuffix: true });
}

/** Absolute timestamp for tooltips. */
function absoluteTime(value?: string | null): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString();
}

/** Detects the 403 raised when a restricted principal can't read this surface. */
function isForbidden(error: unknown): boolean {
	return error instanceof ScopeError || (error as { status?: number })?.status === 403;
}

/** A retryable error state that softens 403s into a friendly notice. */
function QueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
	if (isForbidden(error)) {
		return (
			<PageError
				title="You don't have access to this"
				message="Your principal isn't permitted to read this part of the context's memory. Ask a context owner to widen your scope, then try again."
				onRetry={onRetry}
			/>
		);
	}

	return (
		<PageError
			message={
				(error as Error)?.message ??
				"The request failed. Check your connection and try again."
			}
			onRetry={onRetry}
		/>
	);
}

// ─── Page ───

export default function MemoryView({ context }: ContextViewProps) {
	const [tab, setTab] = useState<string | null>("state");

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Memory"
				title="Memory graph"
				description={`Everything ${context.name} remembers — its structured state, the entities and facts it has learned, and the queries it has resolved.`}
				art={pictoBrain}
			/>

			<Tabs
				value={tab}
				onChange={setTab}
				variant="default"
				keepMounted={false}
			>
				<Tabs.List>
					<Tabs.Tab
						value="state"
						leftSection={<Icon path={iconMemory} />}
					>
						State
					</Tabs.Tab>
					<Tabs.Tab
						value="entities"
						leftSection={<Icon path={iconRelation} />}
					>
						Entities
					</Tabs.Tab>
					<Tabs.Tab
						value="traces"
						leftSection={<Icon path={iconHistory} />}
					>
						Traces
					</Tabs.Tab>
				</Tabs.List>

				<Tabs.Panel
					value="state"
					pt="xl"
				>
					<SpectronGate>{(client) => <StateTab client={client} />}</SpectronGate>
				</Tabs.Panel>
				<Tabs.Panel
					value="entities"
					pt="xl"
				>
					<SpectronGate>{(client) => <EntitiesTab client={client} />}</SpectronGate>
				</Tabs.Panel>
				<Tabs.Panel
					value="traces"
					pt="xl"
				>
					<SpectronGate>{(client) => <TracesTab client={client} />}</SpectronGate>
				</Tabs.Panel>
			</Tabs>
		</Stack>
	);
}

// ─── State tab ───

function StateTab({ client }: { client: Spectron }) {
	const stateQuery = useQuery({
		queryKey: ["spectron", client.contextId, "memory", "state"],
		queryFn: () => client.state(),
		retry: false,
	});

	const profileQuery = useQuery({
		queryKey: ["spectron", client.contextId, "memory", "profile"],
		queryFn: () => client.profile(),
		retry: false,
	});

	if (stateQuery.isPending || profileQuery.isPending) {
		return <PageLoading message="Loading memory state…" />;
	}

	if (stateQuery.isError) {
		return (
			<QueryError
				error={stateQuery.error}
				onRetry={() => stateQuery.refetch()}
			/>
		);
	}

	const state = stateQuery.data;
	const profile = profileQuery.data;

	const categories: { key: MemoryCategory; label: string; data: CategoryState }[] = [
		{ key: "identity", label: "Identity", data: state.identity },
		{ key: "knowledge", label: "Knowledge", data: state.knowledge },
		{ key: "context", label: "Context", data: state.context },
	];

	const totalEntities = categories.reduce((acc, c) => acc + c.data.entities.length, 0);
	const totalAttributes = categories.reduce((acc, c) => acc + c.data.attributes.length, 0);
	const hasAnything =
		totalEntities > 0 ||
		totalAttributes > 0 ||
		state.instructions.length > 0 ||
		state.unknowns.length > 0;

	if (!hasAnything) {
		return (
			<EmptyState
				icon={iconMemory}
				title="No memories yet"
				description="Chat in the Playground or ingest documents, and this context's structured memory will appear here."
			/>
		);
	}

	return (
		<Stack gap="xl">
			<SimpleGrid
				cols={{ base: 1, md: 3 }}
				spacing="md"
			>
				{categories.map((category) => (
					<CategoryCard
						key={category.key}
						categoryKey={category.key}
						label={category.label}
						data={category.data}
					/>
				))}
			</SimpleGrid>

			{profile && <ProfileCard profile={profile} />}

			{state.instructions.length > 0 && (
				<Box>
					<SectionLabel
						icon={iconList}
						title="Instructions"
						count={state.instructions.length}
					/>
					<Paper
						mt="sm"
						p="md"
						radius="md"
						withBorder
					>
						<Stack gap="sm">
							{state.instructions.map((instruction) => (
								<Group
									key={instruction.id}
									gap="sm"
									wrap="nowrap"
									align="flex-start"
								>
									<ThemeIcon
										size={26}
										radius="md"
										variant="light"
										color="violet"
										mt={2}
									>
										<Icon
											path={iconList}
											size="sm"
										/>
									</ThemeIcon>
									<Box flex={1}>
										<Text
											fw={500}
											c="bright"
											className="selectable"
										>
											{instruction.label}
										</Text>
										<Text
											fz="sm"
											className="selectable"
										>
											{instruction.description}
										</Text>
									</Box>
								</Group>
							))}
						</Stack>
					</Paper>
				</Box>
			)}

			{state.unknowns.length > 0 && (
				<Box>
					<SectionLabel
						icon={iconWarning}
						title="Unknowns"
						count={state.unknowns.length}
					/>
					<Paper
						mt="sm"
						p="md"
						radius="md"
						withBorder
						className={classes.unknownsCard}
					>
						<Stack gap="sm">
							{state.unknowns.map((unknown, index) => (
								<Group
									key={`${unknown.about}-${index}`}
									gap="sm"
									wrap="nowrap"
									align="flex-start"
								>
									<Icon
										path={iconWarning}
										c="slate"
										size="sm"
										style={{ marginTop: 4, flexShrink: 0 }}
									/>
									<Box flex={1}>
										<Text
											fw={500}
											c="slate"
											className="selectable"
										>
											{unknown.about}
										</Text>
										<Text
											fz="sm"
											c="slate"
											className="selectable"
										>
											{unknown.reason}
										</Text>
									</Box>
								</Group>
							))}
						</Stack>
					</Paper>
				</Box>
			)}
		</Stack>
	);
}

function CategoryCard({
	categoryKey,
	label,
	data,
}: {
	categoryKey: MemoryCategory;
	label: string;
	data: CategoryState;
}) {
	const color = CATEGORY_COLOR[categoryKey];

	return (
		<Paper
			p="md"
			radius="md"
			withBorder
			h="100%"
		>
			<Group
				justify="space-between"
				align="flex-start"
			>
				<Group gap="sm">
					<ThemeIcon
						size={32}
						radius="md"
						variant="light"
						color={color}
					>
						<Icon path={iconRelation} />
					</ThemeIcon>
					<Text
						fw={600}
						fz="md"
						c="bright"
					>
						{label}
					</Text>
				</Group>
			</Group>

			<Group
				gap="lg"
				mt="md"
			>
				<CountStat
					value={data.entities.length}
					label="Entities"
				/>
				<CountStat
					value={data.attributes.length}
					label="Attributes"
				/>
				<CountStat
					value={data.relations.length}
					label="Relations"
				/>
			</Group>

			{data.entities.length > 0 && (
				<Box mt="md">
					<MiniLabel>Entities</MiniLabel>
					<Stack
						gap={4}
						mt={4}
					>
						{data.entities.slice(0, 6).map((entity) => (
							<Group
								key={entity.id}
								gap={6}
								wrap="nowrap"
							>
								<Text
									fz="sm"
									c="bright"
									truncate
									className="selectable"
								>
									{entity.name}
								</Text>
								<Text
									fz="xs"
									c="slate"
									style={{ flexShrink: 0 }}
								>
									· {entity.entityType}
								</Text>
							</Group>
						))}
						{data.entities.length > 6 && (
							<Text
								fz="xs"
								c="slate"
							>
								+{data.entities.length - 6} more
							</Text>
						)}
					</Stack>
				</Box>
			)}

			{data.attributes.length > 0 && (
				<Box mt="md">
					<MiniLabel>Key facts</MiniLabel>
					<Stack
						gap={4}
						mt={4}
					>
						{data.attributes.slice(0, 6).map((attribute) => (
							<Text
								key={attribute.id}
								fz="sm"
								truncate
								className="selectable"
							>
								<Text
									span
									c="slate"
								>
									{attribute.key}
								</Text>{" "}
								={" "}
								<Text
									span
									c="bright"
								>
									{attribute.value}
								</Text>
							</Text>
						))}
						{data.attributes.length > 6 && (
							<Text
								fz="xs"
								c="slate"
							>
								+{data.attributes.length - 6} more
							</Text>
						)}
					</Stack>
				</Box>
			)}
		</Paper>
	);
}

function ProfileCard({ profile }: { profile: ProfileResponse }) {
	const groups: { label: string; entries: ProfileResponse["static"] }[] = [
		{ label: "Static", entries: profile.static },
		{ label: "Dynamic", entries: profile.dynamic },
		{ label: "Preferences", entries: profile.preferences },
	];

	const hasEntries = groups.some((group) => group.entries.length > 0);
	if (!hasEntries) return null;

	return (
		<Box>
			<SectionLabel
				icon={iconTag}
				title="Profile"
			/>
			<Paper
				mt="sm"
				p="md"
				radius="md"
				withBorder
			>
				<Stack gap="lg">
					{groups
						.filter((group) => group.entries.length > 0)
						.map((group) => (
							<Box key={group.label}>
								<MiniLabel>{group.label}</MiniLabel>
								<Stack
									gap={6}
									mt={6}
								>
									{group.entries.map((entry) => (
										<Group
											key={entry.key}
											gap="md"
											wrap="nowrap"
											align="flex-start"
										>
											<Text
												fz="sm"
												c="slate"
												w={160}
												style={{ flexShrink: 0 }}
												className="selectable"
											>
												{entry.key}
											</Text>
											<Text
												fz="sm"
												c="bright"
												flex={1}
												className="selectable"
											>
												{entry.value}
											</Text>
										</Group>
									))}
								</Stack>
							</Box>
						))}
				</Stack>
			</Paper>
		</Box>
	);
}

// ─── Entities tab ───

function EntitiesTab({ client }: { client: Spectron }) {
	const [search, setSearch] = useState("");
	const [typeFilter, setTypeFilter] = useState<string | null>(null);
	const [selected, setSelected] = useState<{ entityType: string; name: string } | null>(null);

	const listQuery = useQuery({
		queryKey: ["spectron", client.contextId, "memory", "entities"],
		queryFn: () => client.entities.list(),
		retry: false,
	});

	const entities = listQuery.data ?? [];

	const types = useMemo(() => {
		const set = new Set(entities.map((entity) => entity.entityType));
		return Array.from(set).sort();
	}, [entities]);

	const filtered = useMemo(() => {
		const needle = search.trim().toLowerCase();
		return entities.filter((entity) => {
			if (typeFilter && entity.entityType !== typeFilter) return false;
			if (needle && !entity.name.toLowerCase().includes(needle)) return false;
			return true;
		});
	}, [entities, search, typeFilter]);

	if (listQuery.isPending) {
		return <PageLoading message="Loading entities…" />;
	}

	if (listQuery.isError) {
		return (
			<QueryError
				error={listQuery.error}
				onRetry={() => listQuery.refetch()}
			/>
		);
	}

	if (entities.length === 0) {
		return (
			<EmptyState
				icon={iconRelation}
				title="No entities yet"
				description="As this context learns about people, places, and things, they'll show up here as a browsable graph."
			/>
		);
	}

	return (
		<Grid gap="lg">
			<Grid.Col span={{ base: 12, md: 5 }}>
				<Stack gap="sm">
					<TextInput
						placeholder="Search entities…"
						value={search}
						onChange={(event) => setSearch(event.currentTarget.value)}
						leftSection={<Icon path={iconSearch} />}
					/>
					<Select
						placeholder="All types"
						data={types}
						value={typeFilter}
						onChange={setTypeFilter}
						clearable
						leftSection={<Icon path={iconTag} />}
						comboboxProps={{ withinPortal: true }}
					/>
					<Paper
						radius="md"
						withBorder
						style={{ overflow: "hidden" }}
					>
						<ScrollArea.Autosize mah={520}>
							{filtered.length === 0 ? (
								<Text
									p="md"
									fz="sm"
									c="slate"
									ta="center"
								>
									No entities match your filters.
								</Text>
							) : (
								<Stack gap={0}>
									{filtered.map((entity) => {
										const active =
											selected?.entityType === entity.entityType &&
											selected?.name === entity.name;
										return (
											<EntityRow
												key={entity.id}
												entity={entity}
												active={active}
												onSelect={() =>
													setSelected({
														entityType: entity.entityType,
														name: entity.name,
													})
												}
											/>
										);
									})}
								</Stack>
							)}
						</ScrollArea.Autosize>
					</Paper>
				</Stack>
			</Grid.Col>
			<Grid.Col span={{ base: 12, md: 7 }}>
				{selected ? (
					<EntityDetailPanel
						client={client}
						entityType={selected.entityType}
						name={selected.name}
					/>
				) : (
					<Paper
						p={48}
						radius="md"
						withBorder
						h="100%"
					>
						<Center h="100%">
							<Stack
								align="center"
								gap="xs"
							>
								<ThemeIcon
									size={48}
									radius="xl"
									variant="light"
									color="violet"
								>
									<Icon
										path={iconRelation}
										size="lg"
									/>
								</ThemeIcon>
								<Text
									fw={600}
									c="bright"
								>
									Select an entity
								</Text>
								<Text
									fz="sm"
									c="slate"
									ta="center"
								>
									Pick an entity from the list to see its attributes and
									relations.
								</Text>
							</Stack>
						</Center>
					</Paper>
				)}
			</Grid.Col>
		</Grid>
	);
}

function EntityRow({
	entity,
	active,
	onSelect,
}: {
	entity: EntityDetail;
	active: boolean;
	onSelect: () => void;
}) {
	return (
		<Box
			component="button"
			type="button"
			onClick={onSelect}
			className={classes.entityRow}
			data-active={active || undefined}
		>
			<Group
				gap="sm"
				wrap="nowrap"
			>
				<Box flex={1}>
					<Text
						fw={500}
						c="bright"
						truncate
					>
						{entity.name}
					</Text>
					<Group gap={6}>
						<Text
							fz="xs"
							c="slate"
						>
							{entity.entityType}
						</Text>
						<Badge
							size="xs"
							variant="light"
							color={CATEGORY_COLOR[entity.memoryCategory]}
						>
							{entity.memoryCategory}
						</Badge>
					</Group>
				</Box>
				<Icon
					path={iconChevronRight}
					c="slate"
					size="sm"
				/>
			</Group>
		</Box>
	);
}

function EntityDetailPanel({
	client,
	entityType,
	name,
}: {
	client: Spectron;
	entityType: string;
	name: string;
}) {
	const query = useQuery({
		queryKey: ["spectron", client.contextId, "memory", "entity", entityType, name],
		queryFn: () => client.entities.get(entityType, name),
		retry: false,
	});

	const [historyKey, setHistoryKey] = useState<string | null>(null);
	const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);

	if (query.isPending) {
		return (
			<Paper
				p="lg"
				radius="md"
				withBorder
				h="100%"
			>
				<Stack gap="md">
					<Skeleton
						h={28}
						w="60%"
					/>
					<Skeleton h={80} />
					<Skeleton h={120} />
				</Stack>
			</Paper>
		);
	}

	if (query.isError) {
		return (
			<QueryError
				error={query.error}
				onRetry={() => query.refetch()}
			/>
		);
	}

	const { entity, attributes, relations } = query.data;

	const showHistory = (key: string) => {
		setHistoryKey(key);
		openHistory();
	};

	return (
		<Paper
			p="lg"
			radius="md"
			withBorder
			h="100%"
		>
			<Group
				gap="sm"
				align="flex-start"
			>
				<ThemeIcon
					size={40}
					radius="md"
					variant="light"
					color={CATEGORY_COLOR[entity.memoryCategory]}
				>
					<Icon path={iconRelation} />
				</ThemeIcon>
				<Box flex={1}>
					<Text
						fw={700}
						fz="lg"
						c="bright"
						className="selectable"
					>
						{entity.name}
					</Text>
					<Group gap="xs">
						<Badge
							size="sm"
							variant="light"
							color="slate"
						>
							{entity.entityType}
						</Badge>
						<Badge
							size="sm"
							variant="light"
							color={CATEGORY_COLOR[entity.memoryCategory]}
						>
							{entity.memoryCategory}
						</Badge>
						<Tooltip label={`Updated ${absoluteTime(entity.updatedAt)}`}>
							<Text
								fz="xs"
								c="slate"
							>
								updated {relativeTime(entity.updatedAt)}
							</Text>
						</Tooltip>
					</Group>
				</Box>
			</Group>

			<Divider my="md" />

			<SectionLabel
				icon={iconTag}
				title="Attributes"
				count={attributes.length}
			/>
			{attributes.length === 0 ? (
				<Text
					mt="xs"
					fz="sm"
					c="slate"
				>
					No attributes recorded for this entity.
				</Text>
			) : (
				<Stack
					gap="sm"
					mt="sm"
				>
					{attributes.map((attribute) => (
						<AttributeRow
							key={attribute.id}
							attribute={attribute}
							onHistory={() => showHistory(attribute.key)}
						/>
					))}
				</Stack>
			)}

			<Divider my="md" />

			<SectionLabel
				icon={iconRelation}
				title="Relations"
				count={relations.length}
			/>
			{relations.length === 0 ? (
				<Text
					mt="xs"
					fz="sm"
					c="slate"
				>
					No relations recorded for this entity.
				</Text>
			) : (
				<Stack
					gap="xs"
					mt="sm"
				>
					{relations.map((relation) => (
						<RelationRow
							key={relation.id}
							relation={relation}
						/>
					))}
				</Stack>
			)}

			<Drawer
				opened={historyOpened}
				onClose={closeHistory}
				position="right"
				title={
					<Text fw={600}>
						History · <Text span>{historyKey}</Text>
					</Text>
				}
			>
				{historyKey && (
					<AttributeHistory
						client={client}
						entityType={entityType}
						name={name}
						attributeKey={historyKey}
					/>
				)}
			</Drawer>
		</Paper>
	);
}

function AttributeRow({
	attribute,
	onHistory,
}: {
	attribute: AttributeDetail;
	onHistory: () => void;
}) {
	const hasValidity = !!attribute.validFrom || !!attribute.validUntil;

	return (
		<Paper
			p="sm"
			radius="sm"
			withBorder
		>
			<Group
				justify="space-between"
				wrap="nowrap"
				align="flex-start"
			>
				<Box flex={1}>
					<Text
						fz="sm"
						className="selectable"
					>
						<Text
							span
							c="slate"
						>
							{attribute.key}
						</Text>{" "}
						={" "}
						<Text
							span
							c="bright"
							fw={500}
						>
							{attribute.value}
						</Text>
					</Text>
					<Group
						gap="xs"
						mt={6}
					>
						<Badge
							size="xs"
							variant="light"
							color={CATEGORY_COLOR[attribute.memoryCategory]}
						>
							{attribute.memoryCategory}
						</Badge>
						<Badge
							size="xs"
							variant="light"
							color="slate"
						>
							importance {attribute.importance.toFixed(2)}
						</Badge>
						{hasValidity && (
							<Tooltip
								label={`from ${absoluteTime(attribute.validFrom)} · until ${absoluteTime(
									attribute.validUntil,
								)}`}
							>
								<Badge
									size="xs"
									variant="outline"
									color="slate"
									leftSection={
										<Icon
											path={iconClock}
											size="xs"
										/>
									}
								>
									{attribute.validUntil ? "expires" : "valid"}
								</Badge>
							</Tooltip>
						)}
					</Group>
				</Box>
				<Tooltip label="View history">
					<ActionIcon
						variant="subtle"
						color="slate"
						size="sm"
						onClick={onHistory}
						aria-label={`View history for ${attribute.key}`}
					>
						<Icon path={iconHistory} />
					</ActionIcon>
				</Tooltip>
			</Group>
		</Paper>
	);
}

function RelationRow({ relation }: { relation: RelationDetail }) {
	return (
		<Group
			gap="xs"
			wrap="nowrap"
			className="selectable"
		>
			<Text
				fz="sm"
				c="bright"
			>
				{relation.subject}
			</Text>
			<Badge
				size="sm"
				variant="light"
				color="violet"
				leftSection={
					<Icon
						path={iconChevronRight}
						size="xs"
					/>
				}
			>
				{relation.label}
			</Badge>
			<Text
				fz="sm"
				c="bright"
			>
				{relation.object}
			</Text>
		</Group>
	);
}

function AttributeHistory({
	client,
	entityType,
	name,
	attributeKey,
}: {
	client: Spectron;
	entityType: string;
	name: string;
	attributeKey: string;
}) {
	const query = useQuery({
		queryKey: [
			"spectron",
			client.contextId,
			"memory",
			"history",
			entityType,
			name,
			attributeKey,
		],
		queryFn: () => client.entities.history(entityType, name, attributeKey),
		retry: false,
	});

	if (query.isPending) {
		return (
			<Center mih={160}>
				<Loader />
			</Center>
		);
	}

	if (query.isError) {
		return (
			<QueryError
				error={query.error}
				onRetry={() => query.refetch()}
			/>
		);
	}

	const history = query.data;

	if (history.length === 0) {
		return (
			<Text
				fz="sm"
				c="slate"
			>
				No history recorded for this attribute.
			</Text>
		);
	}

	// Newest-first: prefer createdAt, fall back to source order.
	const ordered = [...history].sort((a, b) => {
		const at = new Date(a.createdAt).getTime();
		const bt = new Date(b.createdAt).getTime();
		if (Number.isNaN(at) || Number.isNaN(bt)) return 0;
		return bt - at;
	});

	return (
		<Stack gap="sm">
			{ordered.map((entry, index) => {
				const current = index === 0 && !entry.supersededBy && !entry.validUntil;
				return (
					<Paper
						key={entry.id}
						p="sm"
						radius="sm"
						withBorder
						className={current ? classes.historyCurrent : undefined}
					>
						<Group
							justify="space-between"
							wrap="nowrap"
							align="flex-start"
						>
							<Text
								fz="sm"
								c="bright"
								className="selectable"
							>
								{entry.value}
							</Text>
							{current && (
								<Badge
									size="xs"
									variant="light"
									color="green"
								>
									current
								</Badge>
							)}
						</Group>
						<Group
							gap="md"
							mt={6}
						>
							<Text
								fz="xs"
								c="slate"
							>
								{relativeTime(entry.createdAt)}
							</Text>
							{entry.validUntil && (
								<Text
									fz="xs"
									c="slate"
								>
									until {absoluteTime(entry.validUntil)}
								</Text>
							)}
							{entry.supersededBy && (
								<Text
									fz="xs"
									c="slate"
								>
									superseded
								</Text>
							)}
						</Group>
					</Paper>
				);
			})}
		</Stack>
	);
}

// ─── Traces tab ───

function TracesTab({ client }: { client: Spectron }) {
	const [openTrace, setOpenTrace] = useState<string | null>(null);

	const statsQuery = useQuery({
		queryKey: ["spectron", client.contextId, "memory", "trace-stats"],
		queryFn: () => client.traces.stats(),
		retry: false,
	});

	const tracesQuery = useQuery({
		queryKey: ["spectron", client.contextId, "memory", "traces"],
		queryFn: () => client.traces.list({ limit: 50 }),
		retry: false,
	});

	if (statsQuery.isPending || tracesQuery.isPending) {
		return <PageLoading message="Loading query traces…" />;
	}

	// Stats and the list share an access floor; surface either failure once.
	if (statsQuery.isError || tracesQuery.isError) {
		return (
			<QueryError
				error={statsQuery.error ?? tracesQuery.error}
				onRetry={() => {
					statsQuery.refetch();
					tracesQuery.refetch();
				}}
			/>
		);
	}

	const stats = statsQuery.data;
	const traces = tracesQuery.data;

	if (traces.length === 0 && stats.totalQueries === 0) {
		return (
			<EmptyState
				icon={iconHistory}
				title="No queries traced yet"
				description="Once this context resolves a query — from the Playground or an integrated agent — its retrieval decisions will appear here."
			/>
		);
	}

	const activeTrace = traces.find((trace) => trace.id === openTrace) ?? null;

	return (
		<Stack gap="xl">
			<SimpleGrid
				cols={{ base: 2, md: 4 }}
				spacing="md"
			>
				<TraceStat
					label="Total queries"
					value={stats.totalQueries.toLocaleString()}
				/>
				<TraceStat
					label="Avg latency"
					value={`${Math.round(stats.avgLatencyMs).toLocaleString()} ms`}
				/>
				<TraceStat
					label="Cache hit rate"
					value={`${(stats.cacheHitRate * 100).toFixed(1)}%`}
				/>
				<TraceStat
					label="Cache hits"
					value={stats.cacheHits.toLocaleString()}
				/>
				<TraceStat
					label="Direct"
					value={stats.tierCounts.direct.toLocaleString()}
				/>
				<TraceStat
					label="Hybrid"
					value={stats.tierCounts.hybrid.toLocaleString()}
				/>
				<TraceStat
					label="Full context"
					value={stats.tierCounts.fullContext.toLocaleString()}
				/>
				<TraceStat
					label="Window"
					value={`${stats.windowHours.toLocaleString()} h`}
				/>
			</SimpleGrid>

			<Box>
				<SectionLabel
					icon={iconHistory}
					title="Recent queries"
					count={traces.length}
				/>
				<Paper
					mt="sm"
					radius="md"
					withBorder
					style={{ overflow: "hidden" }}
				>
					<Table.ScrollContainer minWidth={640}>
						<Table
							striped
							highlightOnHover
							verticalSpacing="sm"
							horizontalSpacing="md"
						>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Query</Table.Th>
									<Table.Th>Tier</Table.Th>
									<Table.Th>Latency</Table.Th>
									<Table.Th>Cached</Table.Th>
									<Table.Th>When</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{traces.map((trace) => (
									<Table.Tr
										key={trace.id}
										onClick={() => setOpenTrace(trace.id)}
										style={{ cursor: "pointer" }}
									>
										<Table.Td>
											<Text
												fz="sm"
												c="bright"
												lineClamp={1}
												maw={280}
											>
												{trace.queryText}
											</Text>
										</Table.Td>
										<Table.Td>
											<Badge
												size="sm"
												variant="light"
												color="violet"
											>
												{trace.resolutionTier}
											</Badge>
										</Table.Td>
										<Table.Td>
											<Text fz="sm">
												{trace.latencyMs.toLocaleString()} ms
											</Text>
										</Table.Td>
										<Table.Td>
											<Badge
												size="sm"
												variant="light"
												color={trace.cached ? "green" : "slate"}
											>
												{trace.cached ? "hit" : "miss"}
											</Badge>
										</Table.Td>
										<Table.Td>
											<Tooltip label={absoluteTime(trace.createdAt)}>
												<Text
													fz="sm"
													c="slate"
												>
													{relativeTime(trace.createdAt)}
												</Text>
											</Tooltip>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Table.ScrollContainer>
				</Paper>
			</Box>

			<Drawer
				opened={!!activeTrace}
				onClose={() => setOpenTrace(null)}
				position="right"
				title={<Text fw={600}>Query trace</Text>}
			>
				{activeTrace && <TraceDetail trace={activeTrace} />}
			</Drawer>
		</Stack>
	);
}

function TraceDetail({ trace }: { trace: TraceRecord }) {
	return (
		<Stack gap="md">
			<Box>
				<MiniLabel>Query</MiniLabel>
				<Text
					mt={4}
					c="bright"
					className="selectable"
				>
					{trace.queryText}
				</Text>
			</Box>
			<Group gap="xs">
				<Badge
					variant="light"
					color="violet"
				>
					{trace.resolutionTier}
				</Badge>
				<Badge
					variant="light"
					color={trace.cached ? "green" : "slate"}
				>
					{trace.cached ? "cache hit" : "cache miss"}
				</Badge>
				<Badge
					variant="light"
					color="slate"
				>
					{trace.latencyMs.toLocaleString()} ms
				</Badge>
			</Group>
			<Box>
				<MiniLabel>Tier reason</MiniLabel>
				<Text
					mt={4}
					fz="sm"
					className="selectable"
				>
					{trace.tierReason || "—"}
				</Text>
			</Box>
			<Box>
				<MiniLabel>Resolved</MiniLabel>
				<Text
					mt={4}
					fz="sm"
					c="slate"
				>
					{absoluteTime(trace.createdAt)}
				</Text>
			</Box>
		</Stack>
	);
}

type TraceRecord = Awaited<ReturnType<Spectron["traces"]["list"]>>[number];

// ─── Small shared bits ───

function SectionLabel({ icon, title, count }: { icon: string; title: string; count?: number }) {
	return (
		<Group gap="xs">
			<Icon
				path={icon}
				c="slate"
				size="sm"
			/>
			<Text
				fw={600}
				fz="sm"
				c="bright"
				tt="uppercase"
				style={{ letterSpacing: "0.05em" }}
			>
				{title}
			</Text>
			{count !== undefined && (
				<Badge
					size="sm"
					variant="light"
					color="slate"
				>
					{count}
				</Badge>
			)}
		</Group>
	);
}

function MiniLabel({ children }: { children: React.ReactNode }) {
	return (
		<Text
			fz="xs"
			fw={600}
			tt="uppercase"
			c="slate"
			style={{ letterSpacing: "0.06em" }}
		>
			{children}
		</Text>
	);
}

function CountStat({ value, label }: { value: number; label: string }) {
	return (
		<Box>
			<Text
				fz={22}
				fw={700}
				c="bright"
				lh={1.1}
			>
				{value.toLocaleString()}
			</Text>
			<Text
				fz="xs"
				c="slate"
			>
				{label}
			</Text>
		</Box>
	);
}

function TraceStat({ label, value }: { label: string; value: string }) {
	return (
		<Paper
			p="md"
			radius="md"
			withBorder
		>
			<Text
				fz={24}
				fw={700}
				c="bright"
				lh={1.1}
			>
				{value}
			</Text>
			<Text
				fz="xs"
				c="slate"
				mt={4}
			>
				{label}
			</Text>
		</Paper>
	);
}
