import {
	Accordion,
	Badge,
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Tree,
	type TreeNodeData,
	useTree,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	Icon,
	iconDatabase,
	iconEdit,
	iconNamespace,
	iconPlus,
	iconSearch,
	iconStar,
	iconTrash,
} from "@surrealdb/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { escapeIdent } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useConnection, useIsConnected, useMinimumVersion } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { openEditResourceDescriptionModal } from "~/modals/edit-resource-description";
import { openNewDatabaseModal } from "~/modals/new-database";
import { useConfirmation } from "~/providers/Confirmation";
import {
	activateDatabase,
	executeQuery,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import type { Authentication } from "~/types";
import { getAuthLevel } from "~/util/connection";
import {
	databaseHierarchyQueryKey,
	fetchDatabaseHierarchy,
	invalidateDatabaseHierarchy,
	type NamespaceOrDatabase,
	setInstanceDefaults,
} from "~/util/databases";
import { createBaseAuthentication } from "~/util/defaults";
import { fuzzyMatch } from "~/util/helpers";
import { SDB_DEFINE_CONFIG_DEFAULT } from "~/util/versions";
import type { ConnectionSettingsTabProps } from "../types";

function stopPropagation(event: MouseEvent) {
	event.stopPropagation();
}

interface DatabaseNodeProps {
	namespace: string;
	database: NamespaceOrDatabase;
	isFirst: boolean;
	isLast: boolean;
}

const namespaceTreeGroup = (name: string) => `ns:${name}`;
const databaseBranchArm = "calc(var(--mantine-spacing-xl) / 2)";
const databaseBranchColumn = `calc(-1 * ${databaseBranchArm})`;

export function ConnectionDatabasesTab(_props: ConnectionSettingsTabProps) {
	const connected = useIsConnected();
	const [search, setSearch] = useInputState("");

	const [connectionId, namespace, database, authentication] = useConnection((c) => [
		c?.id ?? "",
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
		c?.authentication ?? createBaseAuthentication(),
	]);

	return (
		<Stack>
			<PrimaryTitle fz={32}>Databases</PrimaryTitle>
			<DatabaseHierarchySection
				key={connectionId}
				connectionId={connectionId}
				connected={connected}
				search={search}
				onSearchChange={setSearch}
				namespace={namespace}
				database={database}
				authentication={authentication}
			/>
		</Stack>
	);
}

interface DatabaseHierarchySectionProps {
	connectionId: string;
	connected: boolean;
	search: string;
	onSearchChange: (value: string) => void;
	namespace: string;
	database: string;
	authentication: Authentication;
}

function DatabaseHierarchySection({
	connectionId,
	connected,
	search,
	onSearchChange,
	namespace,
	database,
	authentication,
}: DatabaseHierarchySectionProps) {
	const queryClient = useQueryClient();
	const [supportsDefaultConfig] = useMinimumVersion(SDB_DEFINE_CONFIG_DEFAULT);
	const [expanded, setExpanded] = useState<string[]>([]);
	const hasInitialized = useRef(false);
	const previousSearch = useRef("");

	const level = getAuthLevel(authentication);
	const canManageNamespaces = level === "root";
	const canManageDatabases = level === "root" || level === "namespace";

	const hierarchyQuery = useQuery({
		queryKey: databaseHierarchyQueryKey(connectionId),
		queryFn: fetchDatabaseHierarchy,
		enabled: connected,
	});

	const filteredHierarchy = useMemo(() => {
		return hierarchyQuery.data?.entries.flatMap((entry) => {
			const namespaceMatch = fuzzyMatch(search, entry.namespace.name);
			const databases = entry.databases.filter(
				(db) => namespaceMatch || fuzzyMatch(search, db.name),
			);

			if (databases.length === 0) {
				return [];
			}

			return [{ namespace: entry.namespace, databases }];
		});
	}, [hierarchyQuery.data?.entries, search]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset expand state when switching connections
	useEffect(() => {
		hasInitialized.current = false;
		previousSearch.current = "";
		setExpanded([]);
	}, [connectionId]);

	useEffect(() => {
		if (!filteredHierarchy?.length || hasInitialized.current) {
			return;
		}

		hasInitialized.current = true;

		if (namespace) {
			setExpanded([namespace]);
			return;
		}

		setExpanded(filteredHierarchy.map((entry) => entry.namespace.name));
	}, [filteredHierarchy, namespace]);

	useEffect(() => {
		if (search === previousSearch.current) {
			return;
		}

		previousSearch.current = search;

		if (!search || !filteredHierarchy?.length) {
			return;
		}

		setExpanded(filteredHierarchy.map((entry) => entry.namespace.name));
	}, [search, filteredHierarchy]);

	const activate = useStable(async (ns: string, db: string) => {
		if (namespace !== ns || database !== db) {
			await activateDatabase(ns, db);
		}
	});

	const activateNamespace = useStable(async (ns: string) => {
		if (namespace !== ns || database) {
			await activateDatabase(ns, "");
		}
	});

	const setDefault = useMutation({
		mutationFn: async ({ ns, db }: { ns: string; db: string }) => {
			await setInstanceDefaults(ns, db);
		},
		onSuccess: () => invalidateDatabaseHierarchy(queryClient, connectionId),
	});

	const openCreator = useStable(() => {
		openNewDatabaseModal();
	});

	const defaults = hierarchyQuery.data?.defaults ?? {};
	const canSetDefault = supportsDefaultConfig && canManageNamespaces;
	const invalidate = useStable(() => invalidateDatabaseHierarchy(queryClient, connectionId));

	return (
		<Section
			title="Namespaces and databases"
			description="Browse the namespace hierarchy, switch context, or manage namespaces and databases"
			rightSection={
				<Button
					size="xs"
					variant="gradient"
					leftSection={<Icon path={iconPlus} />}
					disabled={!connected || !canManageDatabases}
					onClick={openCreator}
				>
					Create
				</Button>
			}
		>
			<TextInput
				mb="md"
				placeholder="Search namespaces and databases"
				leftSection={<Icon path={iconSearch} />}
				value={search}
				onChange={(event) => onSearchChange(event.currentTarget.value)}
			/>

			{!connected ? (
				<Center py="xl">
					<Text>Connect to manage namespaces and databases</Text>
				</Center>
			) : hierarchyQuery.isPending ? (
				<Center py="xl">
					<Loader size="sm" />
				</Center>
			) : filteredHierarchy?.length === 0 ? (
				<Center py="xl">
					<Text fz="sm">No namespaces or databases found</Text>
				</Center>
			) : (
				<Accordion
					multiple
					variant="surreal"
					value={expanded}
					onChange={setExpanded}
					styles={{
						label: { paddingBlock: 8, flex: 1 },
						control: { gap: "var(--mantine-spacing-md)" },
					}}
				>
					{filteredHierarchy?.map((entry) => (
						<Accordion.Item
							key={entry.namespace.name}
							value={entry.namespace.name}
							bg="none"
						>
							<Accordion.Control p={0}>
								<NamespaceHeader
									namespace={entry.namespace}
									count={entry.databases.length}
									isActive={namespace === entry.namespace.name}
									canManage={canManageNamespaces}
									onSelect={() => activateNamespace(entry.namespace.name)}
									onEdit={() =>
										openEditResourceDescriptionModal({
											kind: "namespace",
											name: entry.namespace.name,
											comment: entry.namespace.comment,
										})
									}
									onRemove={invalidate}
								/>
							</Accordion.Control>

							<Accordion.Panel pt="xs">
								<NamespaceDatabaseTree
									namespaceName={entry.namespace.name}
									databases={entry.databases}
									activeNamespace={namespace}
									activeDatabase={database}
									defaults={defaults}
									canManage={canManageDatabases}
									canSetDefault={canSetDefault}
									isSettingDefault={setDefault.isPending}
									onActivate={activate}
									onSetDefault={(ns, db) => setDefault.mutate({ ns, db })}
									onEdit={(database) =>
										openEditResourceDescriptionModal({
											kind: "database",
											name: database.name,
											namespace: entry.namespace.name,
											comment: database.comment,
										})
									}
									onRemove={invalidate}
								/>
							</Accordion.Panel>
						</Accordion.Item>
					))}
				</Accordion>
			)}
		</Section>
	);
}

interface NamespaceDatabaseTreeProps {
	namespaceName: string;
	databases: NamespaceOrDatabase[];
	activeNamespace: string;
	activeDatabase: string;
	defaults: {
		namespace?: string;
		database?: string;
	};
	canManage: boolean;
	canSetDefault: boolean;
	isSettingDefault: boolean;
	onActivate: (ns: string, db: string) => void;
	onSetDefault: (ns: string, db: string) => void;
	onEdit: (database: NamespaceOrDatabase) => void;
	onRemove: () => void;
}

function NamespaceDatabaseTree({
	namespaceName,
	databases,
	activeNamespace,
	activeDatabase,
	defaults,
	canManage,
	canSetDefault,
	isSettingDefault,
	onActivate,
	onSetDefault,
	onEdit,
	onRemove,
}: NamespaceDatabaseTreeProps) {
	const isLight = useIsLight();
	const lineColor = isLight
		? "var(--mantine-color-obsidian-6)"
		: "var(--mantine-color-obsidian-5)";

	const groupKey = namespaceTreeGroup(namespaceName);

	const tree = useTree({
		initialExpandedState: { [groupKey]: true },
	});

	const data = useMemo((): TreeNodeData[] => {
		return [
			{
				value: groupKey,
				label: namespaceName,
				children: databases.map((db, index) => ({
					value: `${namespaceName}/${db.name}`,
					label: db.name,
					nodeProps: {
						namespace: namespaceName,
						database: db,
						isFirst: index === 0,
						isLast: index === databases.length - 1,
					} satisfies DatabaseNodeProps,
				})),
			},
		];
	}, [namespaceName, databases, groupKey]);

	return (
		<Tree
			data={data}
			tree={tree}
			levelOffset="xl"
			expandOnClick={false}
			selectOnClick={false}
			allowRangeSelection={false}
			expandOnSpace={false}
			styles={{
				label: {
					paddingBlock: 0,
					backgroundColor: "transparent",
				},
			}}
			renderNode={(payload) => {
				if (payload.hasChildren) {
					return (
						<Box
							{...payload.elementProps}
							aria-hidden
							h={1}
							m={0}
							p={0}
							style={{
								...payload.elementProps.style,
								opacity: 0,
								overflow: "hidden",
								pointerEvents: "none",
							}}
						/>
					);
				}

				const nodeProps = payload.node.nodeProps as DatabaseNodeProps;

				return (
					<Box
						{...payload.elementProps}
						w="100%"
						onClick={stopPropagation}
						style={{
							...payload.elementProps.style,
							backgroundColor: "transparent",
						}}
					>
						<Box
							pos="relative"
							mb={nodeProps.isLast ? undefined : "md"}
						>
							<Box
								aria-hidden
								pos="absolute"
								left={databaseBranchColumn}
								top={nodeProps.isFirst ? "calc(-1 * var(--mantine-spacing-xs))" : 0}
								bottom="50%"
								w={0}
								style={{ borderLeft: `1px solid ${lineColor}` }}
							/>
							{!nodeProps.isLast && (
								<Box
									aria-hidden
									pos="absolute"
									left={databaseBranchColumn}
									top="50%"
									bottom="calc(-1 * var(--mantine-spacing-md))"
									w={0}
									style={{ borderLeft: `1px solid ${lineColor}` }}
								/>
							)}
							<Box
								aria-hidden
								pos="absolute"
								left={databaseBranchColumn}
								top="50%"
								w={databaseBranchArm}
								h={0}
								style={{ borderTop: `1px solid ${lineColor}` }}
							/>
							<DatabaseRow
								namespace={nodeProps.namespace}
								database={nodeProps.database}
								isActive={
									activeNamespace === nodeProps.namespace &&
									activeDatabase === nodeProps.database.name
								}
								isDefault={
									defaults.namespace === nodeProps.namespace &&
									defaults.database === nodeProps.database.name
								}
								canManage={canManage}
								canSetDefault={canSetDefault}
								isSettingDefault={isSettingDefault}
								onActivate={() =>
									onActivate(nodeProps.namespace, nodeProps.database.name)
								}
								onSetDefault={() =>
									onSetDefault(nodeProps.namespace, nodeProps.database.name)
								}
								onEdit={() => onEdit(nodeProps.database)}
								onRemove={onRemove}
							/>
						</Box>
					</Box>
				);
			}}
		/>
	);
}

interface NamespaceHeaderProps {
	namespace: NamespaceOrDatabase;
	count: number;
	isActive: boolean;
	canManage: boolean;
	onSelect: () => void;
	onEdit: () => void;
	onRemove: () => void;
}

function NamespaceHeader({
	namespace,
	count,
	isActive,
	canManage,
	onSelect,
	onEdit,
	onRemove,
}: NamespaceHeaderProps) {
	const isLight = useIsLight();

	const remove = useConfirmation({
		message: () => (
			<Stack className="selectable">
				<Text>
					You are about to delete the namespace{" "}
					<Text
						span
						c="bright"
						fw={600}
					>
						{namespace.name}
					</Text>
					.
				</Text>
				<Text>
					This action cannot be undone. All databases and their data in this namespace
					will be permanently deleted.
				</Text>
			</Stack>
		),
		confirmText: "Delete namespace",
		verification: "delete",
		onConfirm: async () => {
			await executeQuery(/* surql */ `REMOVE NAMESPACE ${escapeIdent(namespace.name)}`);

			if (isActive) {
				await activateDatabase("", "");
			}

			onRemove();
		},
	});

	return (
		<Paper
			p="md"
			radius="md"
			w="100%"
			bg={isLight ? "obsidian.2" : "obsidian.8"}
			withBorder={isActive}
			style={{
				borderColor: isActive ? "var(--mantine-color-violet-6)" : undefined,
			}}
		>
			<Group
				wrap="nowrap"
				gap="sm"
				miw={0}
				w="100%"
			>
				<ThemeIcon
					size="md"
					color="obsidian"
					variant="light"
				>
					<Icon path={iconNamespace} />
				</ThemeIcon>

				<Box
					flex={1}
					miw={0}
				>
					<Group
						gap="sm"
						wrap="nowrap"
					>
						<Text
							fw={600}
							truncate
							className="selectable"
						>
							{namespace.name}
						</Text>

						<Badge
							size="sm"
							color="obsidian"
							variant="light"
							radius="sm"
						>
							{count}
						</Badge>
					</Group>
					{namespace.comment && (
						<Text
							fz="xs"
							truncate
							className="selectable"
						>
							{namespace.comment}
						</Text>
					)}
				</Box>

				{canManage && (
					<Group
						gap="xs"
						wrap="nowrap"
						onClick={stopPropagation}
					>
						{isActive ? (
							<Badge
								size="sm"
								variant="gradient"
							>
								Active
							</Badge>
						) : (
							<Button
								size="xs"
								variant="light"
								color="violet"
								onClick={onSelect}
							>
								Select
							</Button>
						)}

						<ActionButton
							variant="subtle"
							color="obsidian"
							label="Edit description"
							onClick={onEdit}
						>
							<Icon
								path={iconEdit}
								size="sm"
							/>
						</ActionButton>

						<ActionButton
							variant="subtle"
							color="red"
							label="Delete namespace"
							onClick={remove}
						>
							<Icon
								path={iconTrash}
								size="sm"
							/>
						</ActionButton>
					</Group>
				)}
			</Group>
		</Paper>
	);
}

interface DatabaseRowProps {
	namespace: string;
	database: NamespaceOrDatabase;
	isActive: boolean;
	isDefault: boolean;
	canManage: boolean;
	canSetDefault: boolean;
	isSettingDefault: boolean;
	onActivate: () => void;
	onSetDefault: () => void;
	onEdit: () => void;
	onRemove: () => void;
}

function DatabaseRow({
	namespace,
	database,
	isActive,
	isDefault,
	canManage,
	canSetDefault,
	isSettingDefault,
	onActivate,
	onSetDefault,
	onEdit,
	onRemove,
}: DatabaseRowProps) {
	const remove = useConfirmation({
		message: () => (
			<Stack className="selectable">
				<Text>
					You are about to delete the database{" "}
					<Text
						span
						c="bright"
						fw={600}
					>
						{database.name}
					</Text>{" "}
					in namespace{" "}
					<Text
						span
						c="bright"
						fw={600}
					>
						{namespace}
					</Text>
					.
				</Text>
				<Text>
					This action cannot be undone. All tables and records in this database will be
					permanently deleted.
				</Text>
			</Stack>
		),
		confirmText: "Delete database",
		verification: "delete",
		onConfirm: async () => {
			await executeQuery(/* surql */ `
				USE NS ${escapeIdent(namespace)};
				REMOVE DATABASE ${escapeIdent(database.name)};
			`);

			if (isActive) {
				await activateDatabase(namespace, "");
			}

			onRemove();
		},
	});

	return (
		<Group
			wrap="nowrap"
			gap="md"
			align="center"
			py="sm"
		>
			<ThemeIcon
				size="md"
				color="obsidian"
				variant="light"
			>
				<Icon path={iconDatabase} />
			</ThemeIcon>

			<Box
				flex={1}
				miw={0}
			>
				<Group
					gap="xs"
					wrap="nowrap"
					miw={0}
				>
					<Text
						c="bright"
						fw={isActive ? 600 : 500}
						truncate
						className="selectable"
					>
						{database.name}
					</Text>
					{isDefault && (
						<Badge
							size="xs"
							color="obsidian"
							variant="light"
							leftSection={<Icon path={iconStar} />}
						>
							Default
						</Badge>
					)}
				</Group>
				{database.comment && (
					<Text
						fz="sm"
						truncate
						className="selectable"
					>
						{database.comment}
					</Text>
				)}
			</Box>

			{canSetDefault && !isDefault && (
				<Button
					size="xs"
					variant="subtle"
					color="obsidian"
					leftSection={<Icon path={iconStar} />}
					loading={isSettingDefault}
					onClick={onSetDefault}
				>
					Set default
				</Button>
			)}

			<Group
				gap="xs"
				wrap="nowrap"
			>
				{isActive ? (
					<Badge
						size="sm"
						variant="gradient"
					>
						Active
					</Badge>
				) : (
					<Button
						size="xs"
						variant="light"
						color="violet"
						onClick={onActivate}
					>
						Select
					</Button>
				)}

				{canManage && (
					<>
						<ActionButton
							variant="subtle"
							color="obsidian"
							label="Edit description"
							onClick={onEdit}
						>
							<Icon
								path={iconEdit}
								size="sm"
							/>
						</ActionButton>

						<ActionButton
							variant="subtle"
							color="red"
							label="Delete database"
							onClick={remove}
						>
							<Icon
								path={iconTrash}
								size="sm"
							/>
						</ActionButton>
					</>
				)}
			</Group>
		</Group>
	);
}
