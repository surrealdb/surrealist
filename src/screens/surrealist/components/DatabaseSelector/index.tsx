import { Box, Center, Group, Loader, Menu, ScrollArea, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconCheck, iconCircleFilled, iconPlus, iconSearch } from "@surrealdb/ui";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo } from "react";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openNewDatabaseModal } from "~/modals/new-database";
import { fetchDatabaseList, fetchNamespaceList } from "~/util/databases";
import { createBaseAuthentication } from "~/util/defaults";
import { fuzzyMatch } from "~/util/helpers";
import { activateDatabase } from "../../pages/Connection/connection/connection";

export interface DatabaseSelectorProps {
	opened: boolean;
}

export function DatabaseSelector({ opened }: DatabaseSelectorProps) {
	const connected = useIsConnected();
	const [search, setSearch] = useInputState("");

	const [connectionId, namespace, database] = useConnection((c) => [
		c?.id ?? "",
		c?.lastNamespace ?? "",
		c?.lastDatabase ?? "",
		c?.authentication ?? createBaseAuthentication(),
	]);

	const hierarchyQuery = useQuery({
		queryKey: ["database-hierarchy", connectionId],
		queryFn: async () => {
			const namespaces = await fetchNamespaceList();

			return Promise.all(
				namespaces.map(async (ns) => ({
					namespace: ns,
					databases: await fetchDatabaseList(ns),
				})),
			);
		},
		enabled: opened && connected,
	});

	const filteredHierarchy = useMemo(() => {
		const hierarchy = hierarchyQuery.data ?? [];

		return hierarchy.flatMap((entry) => {
			const databases = entry.databases.filter((db) => fuzzyMatch(search, db));

			if (databases.length === 0) {
				return [];
			}

			return [{ namespace: entry.namespace, databases }];
		});
	}, [hierarchyQuery.data, search]);

	const selectDatabase = useStable(async (ns: string, db: string) => {
		if (namespace !== ns || database !== db) {
			await activateDatabase(ns, db);
		}

		setSearch("");
	});

	const openDatabaseCreator = useStable(() => {
		openNewDatabaseModal();
	});

	return (
		<>
			<Box
				px="sm"
				pt="sm"
			>
				<TextInput
					value={search}
					onChange={setSearch}
					placeholder="Search databases"
					leftSection={<Icon path={iconSearch} />}
					variant="unstyled"
					styles={{
						input: {
							backgroundColor: "rgba(0, 0, 0, 0.15)",
							border: "1px solid rgba(255, 255, 255, 0.125)",
						},
					}}
					radius="xl"
					autoFocus
				/>
			</Box>

			{hierarchyQuery.isPending ? (
				<Center h={72}>
					<Loader size="sm" />
				</Center>
			) : hierarchyQuery.data?.length === 0 ? (
				<Center h={72}>
					<Text fz="xs">No databases available</Text>
				</Center>
			) : filteredHierarchy.length === 0 ? (
				<Center h={72}>
					<Text fz="xs">No databases found</Text>
				</Center>
			) : (
				<ScrollArea.Autosize mah={350}>
					<Box
						p="sm"
						mih={72}
					>
						{filteredHierarchy.map((entry) => (
							<Fragment key={entry.namespace}>
								<Group>
									<Menu.Label flex={1}>{entry.namespace}</Menu.Label>
								</Group>
								{entry.databases.map((db) => (
									<Menu.Item
										key={`${entry.namespace}-${db}`}
										leftSection={
											<Icon
												path={iconCircleFilled}
												color="violet.3"
											/>
										}
										rightSection={
											namespace === entry.namespace && database === db ? (
												<Icon
													path={iconCheck}
													color="violet.3"
												/>
											) : undefined
										}
										onClick={() => selectDatabase(entry.namespace, db)}
									>
										<Text
											truncate
											maw={180}
										>
											{db}
										</Text>
									</Menu.Item>
								))}
							</Fragment>
						))}
					</Box>
				</ScrollArea.Autosize>
			)}

			<Menu.Divider />

			<Box p="sm">
				<Menu.Item
					leftSection={<Icon path={iconPlus} />}
					disabled={!connected}
					onClick={openDatabaseCreator}
				>
					Create database
				</Menu.Item>
			</Box>
		</>
	);
}
