import { Box, Center, Group, Loader, Menu, ScrollArea, Text, TextInput } from "@mantine/core";
import { Icon, iconList, iconPlus, iconSearch } from "@surrealdb/ui";
import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, Fragment, useEffect, useMemo, useRef } from "react";
import { useConnection, useIsConnected } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openNewDatabaseModal } from "~/modals/new-database";
import { useInterfaceStore } from "~/stores/interface";
import { fetchDatabaseList, fetchNamespaceList } from "~/util/databases";
import { createBaseAuthentication } from "~/util/defaults";
import { fuzzyMatch } from "~/util/helpers";
import { activateDatabase } from "../../pages/Connection/connection/connection";
import classes from "./style.module.scss";

export interface DatabaseSelectorProps {
	opened: boolean;
}

export function DatabaseSelector({ opened }: DatabaseSelectorProps) {
	const { setDatabaseSearch } = useInterfaceStore.getState();

	const connected = useIsConnected();
	const search = useInterfaceStore((state) => state.databaseSearch);

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
					databases: await fetchDatabaseList(ns.name),
				})),
			);
		},
		enabled: opened && connected,
	});

	const filteredHierarchy = useMemo(() => {
		const hierarchy = hierarchyQuery.data ?? [];

		return hierarchy.flatMap((entry) => {
			const databases = entry.databases.filter((db) => fuzzyMatch(search, db.name));

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
	});

	const setSearch = useStable((event: ChangeEvent<HTMLInputElement>) => {
		setDatabaseSearch(event.target.value);
	});

	const openDatabaseCreator = useStable(() => {
		openNewDatabaseModal();
	});

	const openSettings = useStable(() => {
		// TODO Link to /c/id/settings/databases
	});

	const searchRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (opened) {
			setTimeout(() => {
				searchRef.current?.focus();
			}, 10);
		}
	}, [opened]);

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
					ref={searchRef}
					size="xs"
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
						mih={72}
						pb="sm"
					>
						{filteredHierarchy.map((entry) => (
							<Fragment key={entry.namespace.name}>
								<Group>
									<Menu.Label
										flex={1}
										mt="md"
									>
										{entry.namespace.name}
									</Menu.Label>
								</Group>
								<Box px="xs">
									{entry.databases.map((db) => (
										<Menu.Item
											key={`${entry.namespace.name}-${db.name}`}
											className={classes.database}
											mod={{
												active:
													namespace === entry.namespace.name &&
													database === db.name,
											}}
											onClick={() =>
												selectDatabase(entry.namespace.name, db.name)
											}
										>
											<Text
												truncate
												maw={400}
												className={classes.databaseName}
											>
												{db.name}
											</Text>
											{db.comment && (
												<Text
													truncate
													maw={400}
													fz="xs"
													opacity={0.5}
												>
													{db.comment}
												</Text>
											)}
										</Menu.Item>
									))}
								</Box>
							</Fragment>
						))}
					</Box>
				</ScrollArea.Autosize>
			)}

			<Menu.Divider mt={0} />

			<Box p="xs">
				<Menu.Item
					leftSection={<Icon path={iconPlus} />}
					disabled={!connected}
					onClick={openDatabaseCreator}
				>
					Create database
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconList} />}
					disabled={!connected}
					onClick={openSettings}
				>
					Manage databases
				</Menu.Item>
			</Box>
		</>
	);
}
