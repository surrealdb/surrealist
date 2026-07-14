import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Center,
	CloseButton,
	Divider,
	Drawer,
	Group,
	Loader,
	Paper,
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
	UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import type { Spectron } from "@surrealdb/spectron";
import { ScopeError } from "@surrealdb/spectron";
import {
	Icon,
	iconAccount,
	iconBook,
	iconChevronRight,
	iconClock,
	iconHistory,
	iconMemory,
	iconRelation,
	iconSearch,
	iconTag,
	pictoSpectronGradient,
	SectionTitle,
} from "@surrealdb/ui";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Fragment, useMemo, useState } from "react";
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

// Distinct icon per node type so identity / knowledge / context are eyeballable
// at a glance in the graph, not just by colour. (#746)
const CATEGORY_ICON: Record<MemoryCategory, string> = {
	identity: iconAccount,
	knowledge: iconBook,
	context: iconTag,
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
				message="Your principal isn't allowed to read this part of the context's memory. Ask a context owner to widen your scope, then try again."
				onRetry={onRetry}
			/>
		);
	}

	return (
		<PageError
			message={
				(error as Error)?.message ??
				"The request failed. Check your connection, then try again."
			}
			onRetry={onRetry}
		/>
	);
}

// ─── Page ───

export default function MemoryView({ context }: ContextViewProps) {
	const [tab, setTab] = useState<string | null>("state");

	return (
		<Stack gap={48}>
			<ContextHero
				kicker="Memory"
				title="Memory graph"
				description={`Everything ${context.name} remembers, including its structured state, the entities and facts it has learned, and the queries it has resolved.`}
				art={pictoSpectronGradient}
			/>

			<Tabs
				value={tab}
				onChange={setTab}
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
	const hasProfileEntries =
		!!profile &&
		(profile.static.length > 0 || profile.dynamic.length > 0 || profile.preferences.length > 0);
	const showProfileColumn = hasProfileEntries || state.instructions.length > 0;
	const showUnknowns = state.unknowns.length > 0;
	const hasAnything =
		totalEntities > 0 ||
		totalAttributes > 0 ||
		state.instructions.length > 0 ||
		state.unknowns.length > 0 ||
		hasProfileEntries;

	if (!hasAnything) {
		return (
			<EmptyState
				icon={iconMemory}
				title="No memories yet"
				description="Chat in the Playground or upload some documents, and this context's structured memory will show up here."
			/>
		);
	}

	return (
		<Stack gap="lg">
			<SectionTitle
				kicker="Overview"
				order={3}
				description="Counts by memory type. Browse the Entities tab for the full graph."
			>
				Memory state
			</SectionTitle>

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

			{(showProfileColumn || showUnknowns) && (
				<Paper
					radius="md"
					withBorder
					className={classes.stateNotes}
				>
					{showProfileColumn && (
						<StateFactBlock
							title={hasProfileEntries && profile ? "Profile" : "Instructions"}
							rows={buildProfileRows(
								hasProfileEntries && profile ? profile : null,
								state.instructions,
							)}
						/>
					)}
					{showProfileColumn && showUnknowns && <Divider />}
					{showUnknowns && (
						<StateFactBlock
							title="Unknowns"
							rows={state.unknowns.map((unknown, index) => ({
								key: `${unknown.about}-${index}`,
								label: unknown.about,
								value: unknown.reason,
							}))}
						/>
					)}
				</Paper>
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
			h="100%"
		>
			<Group
				gap="sm"
				mb="sm"
			>
				<ThemeIcon
					size={28}
					radius="md"
					variant="light"
					color={color}
				>
					<Icon
						path={CATEGORY_ICON[categoryKey]}
						size="sm"
					/>
				</ThemeIcon>
				<Text
					fw={600}
					c="bright"
				>
					{label}
				</Text>
			</Group>

			<Group gap="lg">
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
		</Paper>
	);
}

type FactRow = {
	key: string;
	label: string;
	value: string;
	group?: string;
};

function buildProfileRows(
	profile: ProfileResponse | null,
	instructions: StateResponse["instructions"],
): FactRow[] {
	const rows: FactRow[] = [];

	if (profile) {
		const groups = [
			{ label: "Static", entries: profile.static },
			{ label: "Dynamic", entries: profile.dynamic },
			{ label: "Preferences", entries: profile.preferences },
		].filter((group) => group.entries.length > 0);

		for (const group of groups) {
			const groupLabel = groups.length > 1 ? group.label : undefined;
			for (const [index, entry] of group.entries.entries()) {
				rows.push({
					key: `${group.label}:${entry.key}:${index}`,
					label: entry.key,
					value: entry.value,
					group: groupLabel,
				});
			}
		}
	}

	const instructionGroup = rows.length > 0 ? "Instructions" : undefined;
	for (const instruction of instructions) {
		rows.push({
			key: instruction.id,
			label: instruction.label,
			value: instruction.description,
			group: instructionGroup,
		});
	}

	return rows;
}

function StateFactBlock({ title, rows }: { title: string; rows: FactRow[] }) {
	if (rows.length === 0) return null;

	const items: { row: FactRow; showGroup: boolean }[] = [];
	let lastGroup: string | undefined;
	for (const row of rows) {
		const showGroup = row.group !== undefined && row.group !== lastGroup;
		if (showGroup) lastGroup = row.group;
		items.push({ row, showGroup });
	}

	return (
		<Box>
			<Box
				px="md"
				py="xs"
				className={classes.stateNotesHeader}
			>
				<Text
					fw={600}
					fz="sm"
					c="bright"
				>
					{title}
				</Text>
			</Box>
			<Table
				verticalSpacing={6}
				horizontalSpacing="md"
				layout="fixed"
				className={classes.stateFactTable}
			>
				<Table.Tbody>
					{items.map(({ row, showGroup }) => (
						<Fragment key={row.key}>
							{showGroup && (
								<Table.Tr>
									<Table.Td
										colSpan={2}
										className={classes.factGroupRow}
									>
										<Text
											fz="xs"
											c="slate"
											tt="uppercase"
										>
											{row.group}
										</Text>
									</Table.Td>
								</Table.Tr>
							)}
							<Table.Tr>
								<Table.Td className={classes.factLabelCell}>
									<Text
										fz="sm"
										className="selectable"
									>
										{row.label}
									</Text>
								</Table.Td>
								<Table.Td className={classes.factValueCell}>
									<Text
										fz="sm"
										c="bright"
										className="selectable"
									>
										{row.value}
									</Text>
								</Table.Td>
							</Table.Tr>
						</Fragment>
					))}
				</Table.Tbody>
			</Table>
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

	const isFiltering = search.trim().length > 0 || typeFilter !== null;

	if (listQuery.isPending) {
		return (
			<Stack gap="lg">
				<SectionTitle
					kicker="Graph"
					order={3}
					mb="md"
					description="People, places, and things this context has learned about. Select an entity to explore its facts and connections."
				>
					Entities
				</SectionTitle>
				<EntityToolbar
					search={search}
					onSearchChange={setSearch}
					onClearSearch={() => setSearch("")}
					typeFilter={typeFilter}
					onTypeFilterChange={setTypeFilter}
					types={types}
					total={0}
					filtered={0}
					disabled
				/>
				<SimpleGrid
					cols={{ base: 1, sm: 2, lg: 3 }}
					spacing="md"
				>
					{Array.from({ length: 6 }).map((_, index) => (
						<Skeleton
							key={index}
							h={112}
							radius="md"
						/>
					))}
				</SimpleGrid>
			</Stack>
		);
	}

	if (listQuery.isError) {
		return (
			<Stack gap="lg">
				<SectionTitle
					kicker="Graph"
					order={3}
					mb="md"
				>
					Entities
				</SectionTitle>
				<QueryError
					error={listQuery.error}
					onRetry={() => listQuery.refetch()}
				/>
			</Stack>
		);
	}

	if (entities.length === 0) {
		return (
			<Stack gap="lg">
				<SectionTitle
					kicker="Graph"
					order={3}
					mb="md"
				>
					Entities
				</SectionTitle>
				<EmptyState
					icon={iconRelation}
					title="No entities yet"
					description="As this context learns about people, places, and things, they'll show up here as a browsable graph."
				/>
			</Stack>
		);
	}

	return (
		<Stack gap="lg">
			<SectionTitle
				kicker="Graph"
				order={3}
				description="People, places, and things this context has learned about. Select an entity to explore its facts and connections."
			>
				Entities
			</SectionTitle>

			<EntityToolbar
				search={search}
				onSearchChange={setSearch}
				onClearSearch={() => setSearch("")}
				typeFilter={typeFilter}
				onTypeFilterChange={setTypeFilter}
				types={types}
				total={entities.length}
				filtered={filtered.length}
			/>

			{filtered.length === 0 ? (
				<Paper
					p="xl"
					radius="md"
				>
					<Stack
						align="center"
						gap="xs"
						maw={360}
						mx="auto"
					>
						<ThemeIcon
							size={44}
							radius="xl"
							variant="light"
							color="slate"
						>
							<Icon path={iconSearch} />
						</ThemeIcon>
						<Text
							fw={600}
							c="bright"
							ta="center"
						>
							No entities match your filters
						</Text>
						<Text
							fz="sm"
							ta="center"
						>
							{isFiltering
								? "Try a different name or clear the type filter to see all entities."
								: "No entities are available right now."}
						</Text>
						{isFiltering && (
							<Button
								variant="light"
								color="slate"
								size="xs"
								mt="xs"
								onClick={() => {
									setSearch("");
									setTypeFilter(null);
								}}
							>
								Clear filters
							</Button>
						)}
					</Stack>
				</Paper>
			) : (
				<SimpleGrid
					cols={{ base: 1, sm: 2, lg: 3 }}
					spacing="md"
				>
					{filtered.map((entity) => (
						<EntityCard
							key={entity.id}
							entity={entity}
							onSelect={() =>
								setSelected({
									entityType: entity.entityType,
									name: entity.name,
								})
							}
						/>
					))}
				</SimpleGrid>
			)}

			<EntityInspectorDrawer
				client={client}
				selection={selected}
				onClose={() => setSelected(null)}
			/>
		</Stack>
	);
}

interface EntityToolbarProps {
	search: string;
	onSearchChange: (value: string) => void;
	onClearSearch: () => void;
	typeFilter: string | null;
	onTypeFilterChange: (value: string | null) => void;
	types: string[];
	total: number;
	filtered: number;
	disabled?: boolean;
}

function EntityToolbar({
	search,
	onSearchChange,
	onClearSearch,
	typeFilter,
	onTypeFilterChange,
	types,
	total,
	filtered,
	disabled,
}: EntityToolbarProps) {
	const isFiltering = search.trim().length > 0 || typeFilter !== null;
	const countLabel = isFiltering
		? `${filtered.toLocaleString()} of ${total.toLocaleString()}`
		: total.toLocaleString();

	return (
		<Group
			justify="space-between"
			gap="md"
			wrap="wrap"
		>
			<Group
				gap="sm"
				wrap="nowrap"
				style={{ flex: 1, minWidth: 280 }}
			>
				<TextInput
					placeholder="Search by name…"
					value={search}
					disabled={disabled}
					onChange={(event) => onSearchChange(event.currentTarget.value)}
					leftSection={<Icon path={iconSearch} />}
					rightSection={
						search ? (
							<CloseButton
								size="sm"
								aria-label="Clear search"
								onClick={onClearSearch}
							/>
						) : undefined
					}
					style={{ flex: 1, maxWidth: 360 }}
				/>
				<Select
					placeholder="All types"
					data={types}
					value={typeFilter}
					onChange={onTypeFilterChange}
					clearable
					disabled={disabled || types.length === 0}
					w={180}
					comboboxProps={{ withinPortal: true }}
				/>
			</Group>
			<Text
				fz="sm"
				c="slate"
				className="selectable"
			>
				{countLabel} {total === 1 ? "entity" : "entities"}
			</Text>
		</Group>
	);
}

function EntityCard({ entity, onSelect }: { entity: EntityDetail; onSelect: () => void }) {
	const color = CATEGORY_COLOR[entity.memoryCategory];

	return (
		<UnstyledButton
			onClick={onSelect}
			className={classes.entityCard}
			aria-label={`View ${entity.name}`}
		>
			<Paper
				p="md"
				radius="md"
				withBorder
				className={classes.entityCardSurface}
			>
				<Group
					gap="sm"
					wrap="nowrap"
					align="flex-start"
				>
					<ThemeIcon
						size={40}
						radius="md"
						variant="light"
						color={color}
					>
						<Icon
							path={CATEGORY_ICON[entity.memoryCategory]}
							size="lg"
						/>
					</ThemeIcon>
					<Box
						flex={1}
						miw={0}
					>
						<Text
							fw={600}
							c="bright"
							truncate
							title={entity.name}
							className="selectable"
						>
							{entity.name}
						</Text>
						<Group
							gap={6}
							mt={4}
							wrap="wrap"
						>
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
								color={color}
							>
								{entity.memoryCategory}
							</Badge>
						</Group>
						<Text
							fz="xs"
							c="slate"
							mt={6}
						>
							Updated {relativeTime(entity.updatedAt)}
						</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						c="slate"
						size="sm"
					/>
				</Group>
			</Paper>
		</UnstyledButton>
	);
}

function EntityInspectorDrawer({
	client,
	selection,
	onClose,
}: {
	client: Spectron;
	selection: { entityType: string; name: string } | null;
	onClose: () => void;
}) {
	const [historyKey, setHistoryKey] = useState<string | null>(null);
	const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);

	const query = useQuery({
		queryKey: [
			"spectron",
			client.contextId,
			"memory",
			"entity",
			selection?.entityType,
			selection?.name,
		],
		queryFn: () => {
			if (!selection) {
				throw new Error("No entity selected");
			}
			return client.entities.get(selection.entityType, selection.name);
		},
		enabled: selection !== null,
		retry: false,
	});

	const showHistory = (key: string) => {
		setHistoryKey(key);
		openHistory();
	};

	const entity = query.data?.entity;

	return (
		<>
			<Drawer
				opened={selection !== null}
				onClose={onClose}
				position="right"
				size="lg"
				title={
					query.isPending || !entity ? (
						<Skeleton
							h={28}
							w={200}
						/>
					) : (
						<Group
							gap="sm"
							wrap="nowrap"
						>
							<ThemeIcon
								size={32}
								radius="md"
								variant="light"
								color={CATEGORY_COLOR[entity.memoryCategory]}
							>
								<Icon path={CATEGORY_ICON[entity.memoryCategory]} />
							</ThemeIcon>
							<Text
								fw={600}
								c="bright"
								truncate
								className="selectable"
							>
								{entity.name}
							</Text>
						</Group>
					)
				}
			>
				{selection &&
					(query.isPending ? (
						<Stack gap="md">
							<Skeleton
								h={24}
								w="40%"
							/>
							<Skeleton h={80} />
							<Skeleton h={120} />
						</Stack>
					) : query.isError ? (
						<QueryError
							error={query.error}
							onRetry={() => query.refetch()}
						/>
					) : (
						<EntityDetailBody
							entity={query.data.entity}
							attributes={query.data.attributes}
							relations={query.data.relations}
							onShowHistory={showHistory}
						/>
					))}
			</Drawer>

			<Drawer
				opened={historyOpened}
				onClose={closeHistory}
				position="right"
				size="md"
				title={
					<Text fw={600}>
						Attribute history · <Text span>{historyKey}</Text>
					</Text>
				}
			>
				{historyKey && selection && (
					<AttributeHistory
						client={client}
						entityType={selection.entityType}
						name={selection.name}
						attributeKey={historyKey}
					/>
				)}
			</Drawer>
		</>
	);
}

function EntityDetailBody({
	entity,
	attributes,
	relations,
	onShowHistory,
}: {
	entity: EntityDetail;
	attributes: AttributeDetail[];
	relations: RelationDetail[];
	onShowHistory: (key: string) => void;
}) {
	return (
		<Stack gap="lg">
			<Group
				gap="xs"
				wrap="wrap"
			>
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
						Updated {relativeTime(entity.updatedAt)}
					</Text>
				</Tooltip>
			</Group>

			<Box>
				<SectionTitle
					kicker="Facts"
					order={4}
					mb="sm"
					description="Key-value properties recorded about this entity."
				>
					Attributes
				</SectionTitle>
				{attributes.length === 0 ? (
					<Text
						fz="sm"
						c="slate"
					>
						No attributes recorded for this entity yet.
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
								onHistory={() => onShowHistory(attribute.key)}
							/>
						))}
					</Stack>
				)}
			</Box>

			<Box>
				<SectionTitle
					kicker="Graph"
					order={4}
					mb="sm"
					description="How this entity connects to others in the memory graph."
				>
					Relations
				</SectionTitle>
				{relations.length === 0 ? (
					<Text
						fz="sm"
						c="slate"
					>
						No relations recorded for this entity yet.
					</Text>
				) : (
					<Stack
						gap="sm"
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
			</Box>
		</Stack>
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
			className={classes.factRow}
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
		<Paper
			p="sm"
			radius="sm"
			className={classes.factRow}
		>
			<Group
				gap="xs"
				wrap="wrap"
				className="selectable"
			>
				<Text
					fz="sm"
					c="bright"
					fw={500}
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
					fw={500}
				>
					{relation.object}
				</Text>
			</Group>
		</Paper>
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
						className={current ? classes.historyCurrent : classes.factRow}
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
	const traces = tracesQuery.data ?? [];

	if (traces.length === 0 && stats.totalQueries === 0) {
		return (
			<EmptyState
				icon={iconHistory}
				title="No queries traced yet"
				description="Once this context resolves a query, whether from the Playground or an integrated agent, its retrieval decisions will show up here."
			/>
		);
	}

	const activeTrace = traces.find((trace) => trace.id === openTrace) ?? null;

	return (
		<Stack gap="xl">
			<Box>
				<SectionTitle
					kicker="Retrieval"
					order={3}
					mb="md"
				>
					Query statistics
				</SectionTitle>
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
			</Box>

			<Box>
				<SectionTitle
					kicker="Activity"
					order={3}
					mb="md"
					description="Individual retrieval decisions from the Playground or integrated agents. Click a row for details."
				>
					Recent queries
				</SectionTitle>
				{traces.length === 0 ? (
					<Paper
						p="xl"
						radius="md"
					>
						<Stack
							align="center"
							gap="xs"
							maw={360}
							mx="auto"
						>
							<ThemeIcon
								size={44}
								radius="xl"
								variant="light"
								color="slate"
							>
								<Icon path={iconHistory} />
							</ThemeIcon>
							<Text
								fw={600}
								c="bright"
								ta="center"
							>
								No recent queries in this window
							</Text>
							<Text
								fz="sm"
								ta="center"
							>
								Statistics reflect activity in the current time window, but no
								individual trace records are available to list right now.
							</Text>
						</Stack>
					</Paper>
				) : (
					<Paper
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
													className="selectable"
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
				)}
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
				fz={20}
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
		>
			<Text
				fz={24}
				fw={700}
				c="bright"
				lh={1.1}
				className="selectable"
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
