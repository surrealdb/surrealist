import { Button, Center, Group, Loader, Paper, Stack, Table, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconDatabase, iconPlus, iconSearch, iconTrash } from "@surrealdb/ui";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, type SyntheticEvent } from "react";
import { escapeIdent } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openNewDatabaseModal } from "~/modals/new-database";
import { useConfirmation } from "~/providers/Confirmation";
import {
	activateDatabase,
	executeQuery,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import {
	databaseHierarchyQueryKey,
	fetchDatabaseHierarchy,
	invalidateDatabaseHierarchy,
} from "~/util/databases";
import { fuzzyMatch } from "~/util/helpers";
import classes from "../style.module.scss";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionDatabasesTab(_props: ConnectionSettingsTabProps) {
	const queryClient = useQueryClient();
	const connected = useIsConnected();
	const [search, setSearch] = useInputState("");

	const [connectionId, namespace, database] = useConnection((c) => [
		c?.id ?? "",
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
	]);

	const hierarchyQuery = useQuery({
		queryKey: databaseHierarchyQueryKey(connectionId),
		queryFn: fetchDatabaseHierarchy,
		enabled: connected,
	});

	const filteredHierarchy = hierarchyQuery.data?.flatMap((entry) => {
		const databases = entry.databases.filter((db) => fuzzyMatch(search, db.name));

		if (databases.length === 0) {
			return [];
		}

		return [{ namespace: entry.namespace, databases }];
	});

	const activate = useStable(async (ns: string, db: string) => {
		if (namespace !== ns || database !== db) {
			await activateDatabase(ns, db);
		}
	});

	const openCreator = useStable(() => {
		openNewDatabaseModal();
	});

	return (
		<Stack>
			<PrimaryTitle fz={32}>Databases</PrimaryTitle>
			<Section
				title="Namespaces and databases"
				description="Manage, activate, or remove namespaces and databases on this connection"
				rightSection={
					<Button
						size="xs"
						variant="gradient"
						leftSection={<Icon path={iconPlus} />}
						disabled={!connected}
						onClick={openCreator}
					>
						Create database
					</Button>
				}
			>
				<Paper p="md">
					<TextInput
						mb="md"
						placeholder="Search databases"
						leftSection={<Icon path={iconSearch} />}
						value={search}
						onChange={setSearch}
					/>

					{!connected ? (
						<Center py="xl">
							<Text>Connect to manage databases</Text>
						</Center>
					) : hierarchyQuery.isPending ? (
						<Center py="xl">
							<Loader size="sm" />
						</Center>
					) : filteredHierarchy?.length === 0 ? (
						<Center py="xl">
							<Text fz="sm">No databases found</Text>
						</Center>
					) : (
						<Table
							className={classes.table}
							verticalSpacing="md"
						>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Namespace</Table.Th>
									<Table.Th>Database</Table.Th>
									<Table.Th>Comment</Table.Th>
									<Table.Th w={120} />
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{filteredHierarchy?.map((entry) => (
									<Fragment key={entry.namespace.name}>
										{entry.databases.map((db) => {
											const isActive =
												namespace === entry.namespace.name &&
												database === db.name;

											return (
												<DatabaseRow
													key={`${entry.namespace.name}-${db.name}`}
													namespace={entry.namespace.name}
													database={db.name}
													comment={db.comment}
													isActive={isActive}
													onActivate={() =>
														activate(entry.namespace.name, db.name)
													}
													onRemove={() =>
														invalidateDatabaseHierarchy(
															queryClient,
															connectionId,
														)
													}
												/>
											);
										})}
									</Fragment>
								))}
							</Table.Tbody>
						</Table>
					)}
				</Paper>
			</Section>
		</Stack>
	);
}

interface DatabaseRowProps {
	namespace: string;
	database: string;
	comment?: string;
	isActive: boolean;
	onActivate: () => void;
	onRemove: () => void;
}

function DatabaseRow({
	namespace,
	database,
	comment,
	isActive,
	onActivate,
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
						{database}
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
				REMOVE DATABASE ${escapeIdent(database)};
			`);

			onRemove();
		},
	});

	const requestRemove = useStable((e: SyntheticEvent) => {
		e.stopPropagation();
		remove();
	});

	return (
		<Table.Tr
			mod={{ active: isActive }}
			onClick={onActivate}
			style={{ cursor: "pointer" }}
		>
			<Table.Td className="selectable">{namespace}</Table.Td>
			<Table.Td>
				<Group gap="xs">
					<Icon
						path={iconDatabase}
						size="sm"
					/>
					<Text
						className="selectable"
						fw={isActive ? 600 : undefined}
					>
						{database}
					</Text>
				</Group>
			</Table.Td>
			<Table.Td className="selectable">{comment ?? "—"}</Table.Td>
			<Table.Td>
				<Group
					gap="xs"
					justify="flex-end"
				>
					<ActionButton
						variant="subtle"
						color="red"
						label="Delete database"
						onClick={requestRemove}
					>
						<Icon
							path={iconTrash}
							size="sm"
						/>
					</ActionButton>
				</Group>
			</Table.Td>
		</Table.Tr>
	);
}
