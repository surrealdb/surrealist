import {
	ActionIcon,
	Anchor,
	Box,
	Button,
	Center,
	Group,
	Indicator,
	Loader,
	Menu,
	Paper,
	ScrollArea,
	SimpleGrid,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import {
	useDebouncedValue,
	useDisclosure,
	useInputState,
} from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useMemo, useState } from "react";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import {
	useAvailableInstanceTypes,
	useAvailableRegions,
	useOrganization,
} from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import type { CloudInstance } from "~/types";
import { createBaseConnection, createCloudInstance } from "~/util/defaults";
import { fuzzyMatch } from "~/util/helpers";
import {
	iconCheck,
	iconOpen,
	iconPlus,
	iconSearch,
	iconTune,
	iconViewGrid,
	iconViewList,
} from "~/util/icons";
import { fetchAPI } from "../../api";
import { type ConnectMethod, Instance } from "../../components/Instance";
import { ConnectCliModal } from "./modals/connect-cli";
import { ConnectSdkModal } from "./modals/connect-sdk";
import { SettingsModal } from "./modals/settings";
import classes from "./style.module.scss";

interface Filter {
	type: string;
	value: string;
	label: string;
}

export function InstancesPage() {
	const { setActiveCloudPage } = useConfigStore.getState();

	const [search, setSearch] = useInputState("");
	const [filter, setFilter] = useState<Filter | null>(null);
	const [searchQuery] = useDebouncedValue(search, 150);

	const regions = useAvailableRegions();
	const organization = useOrganization();
	const instanceTypes = useAvailableInstanceTypes();
	const authState = useCloudStore((state) => state.authState);

	const { data, isPending, refetch } = useQuery({
		queryKey: ["cloud", "databases", organization?.id],
		refetchInterval: 15_000,
		enabled: authState === "authenticated",
		queryFn: async () => {
			return fetchAPI<CloudInstance[]>(
				`/organizations/${organization?.id}/instances`,
			);
		},
	});

	const instances = useMemo(() => data || [], [data]);

	const [selectedInstance, setSelectedInstance] = useState(
		createCloudInstance(),
	);
	const [showSdkConnect, sdkConnectHandle] = useDisclosure();
	const [showCliConnect, cliConnectHandle] = useDisclosure();
	const [showSettings, settingsHandle] = useDisclosure();

	const handleProvision = useStable(() => {
		setActiveCloudPage("provision");
	});

	const handleConnect = useStable(
		(method: ConnectMethod, db: CloudInstance) => {
			setSelectedInstance(db);

			if (method === "surrealist") {
				const {
					connections,
					settings,
					addConnection,
					setActiveConnection,
					setActiveView,
				} = useConfigStore.getState();
				const existing = connections.find(
					(conn) => conn.authentication.cloudInstance === db.id,
				);

				setActiveView("query");

				if (existing) {
					setActiveConnection(existing.id);
				} else {
					const base = createBaseConnection(settings);

					addConnection({
						...base,
						name: db.name,
						authentication: {
							...base.authentication,
							protocol: "wss",
							mode: "cloud",
							token: "",
							hostname: db.host,
							cloudInstance: db.id,
						},
					});

					setActiveConnection(base.id);
				}
			} else if (method === "sdk") {
				sdkConnectHandle.open();
			} else {
				cliConnectHandle.open();
			}
		},
	);

	const handleSettings = useStable((db: CloudInstance) => {
		setSelectedInstance(db);
		settingsHandle.open();
	});

	const filterTypes = useMemo(() => {
		return [
			{
				title: "Type",
				options: instanceTypes.map((type) => ({
					type: "type",
					value: type.slug,
					label: type.slug,
				})),
			},
			{
				title: "Region",
				options: regions.map((region) => ({
					type: "region",
					value: region.slug,
					label: region.description,
				})),
			},
			// {
			// 	title: "Status",
			// 	options: [
			// 		{ type: "status", value: "enabled", label: "Enabled" },
			// 		{ type: "status", value: "disabled", label: "Disabled" }
			// 	]
			// }
		];
	}, [instanceTypes, regions]);

	const instanceList = useMemo(() => {
		return instances
			.filter((db) => {
				if (!filter) return true;

				if (filter.type === "type") {
					return db.type.slug === filter.value;
				}

				if (filter.type === "region") {
					return db.region === filter.value;
				}

				// if (filter.type === "status") {
				// 	return db.state === filter.value;
				// }

				return true;
			})
			.filter((db) => fuzzyMatch(searchQuery, db.name))
			.sort((a, b) => {
				const ai = a.state === "inactive";
				const bi = b.state === "inactive";

				if (ai !== bi) {
					return +ai - +bi;
				}

				return a.name.localeCompare(b.name);
			});
	}, [instances, filter, searchQuery]);

	const [mode, setMode] = useSetting("cloud", "databaseListMode");

	const isFresh = instances.length === 0;
	const isEmpty = instanceList.length === 0;

	return (
		<>
			{!isPending && !isFresh && (
				<Group gap="lg" mb="xs">
					<Button
						variant="gradient"
						leftSection={<Icon path={iconPlus} />}
						onClick={handleProvision}
						radius="sm"
						size="xs"
					>
						Create instance
					</Button>
					<Spacer />
					<Menu>
						<Menu.Target>
							<Tooltip label="Filter instances">
								<Indicator
									disabled={!filter}
									color="blue"
									size={7}
								>
									<ActionIcon
										variant="subtle"
										color="slate"
										disabled={instances.length === 0}
									>
										<Icon path={iconTune} />
									</ActionIcon>
								</Indicator>
							</Tooltip>
						</Menu.Target>
						<Menu.Dropdown miw={150}>
							{filterTypes.map((type) => (
								<Fragment key={type.title}>
									<Menu.Label>{type.title}</Menu.Label>
									{type.options.map((option) => {
										const isActive =
											filter?.value === option.value;

										return (
											<Menu.Item
												key={option.value}
												onClick={() =>
													setFilter(
														isActive
															? null
															: option,
													)
												}
												rightSection={
													isActive && (
														<Icon
															path={iconCheck}
														/>
													)
												}
											>
												{option.label}
											</Menu.Item>
										);
									})}
								</Fragment>
							))}
						</Menu.Dropdown>
					</Menu>
					<TextInput
						value={search}
						onChange={setSearch}
						placeholder="Search instances"
						leftSection={<Icon path={iconSearch} size="sm" />}
						radius="sm"
						size="xs"
						miw={250}
					/>
					<ActionIcon.Group>
						<ActionIcon
							c={mode === "grid" ? "bright" : "slate.3"}
							onClick={() => setMode("grid")}
						>
							<Icon path={iconViewGrid} />
						</ActionIcon>
						<ActionIcon
							c={mode === "list" ? "bright" : "slate.3"}
							onClick={() => setMode("list")}
						>
							<Icon path={iconViewList} />
						</ActionIcon>
					</ActionIcon.Group>
				</Group>
			)}
			{isEmpty && instances.length === 0 ? (
				<Center flex={1}>
					{isPending ? (
						<Loader />
					) : (
						<Paper radius="md" p="xl" w={500}>
							<PrimaryTitle>
								Create your first instance
							</PrimaryTitle>
							<Text mt="xl">
								This organization does not have any instances
								yet. Create your first instance to get started
								with Surreal Cloud.
							</Text>
							<Group>
								<Anchor href="https://surrealdb.com/docs/cloud">
									<Button
										mt="xl"
										color="slate"
										variant="light"
										rightSection={<Icon path={iconOpen} />}
										radius="sm"
										size="xs"
									>
										Learn more
									</Button>
								</Anchor>
								<Spacer />
								<Button
									mt="xl"
									variant="gradient"
									leftSection={<Icon path={iconPlus} />}
									onClick={handleProvision}
									radius="sm"
									size="xs"
								>
									Create instance
								</Button>
							</Group>
						</Paper>
					)}
				</Center>
			) : isEmpty ? (
				<Box mt={150} c="slate" fz="lg" ta="center">
					No matching instances found
				</Box>
			) : (
				<Box flex={1} pos="relative">
					<ScrollArea pos="absolute" scrollbars="y" inset={0}>
						{mode === "grid" ? (
							<SimpleGrid
								cols={{ xs: 1, sm: 2, md: 2, lg: 2, xl: 3 }}
								spacing="xl"
							>
								{instanceList.map((db) => (
									<Instance
										key={db.id}
										value={db}
										type="card"
										onDelete={refetch}
										onConnect={handleConnect}
										onOpenSettings={handleSettings}
									/>
								))}
							</SimpleGrid>
						) : (
							<Table className={classes.table}>
								<Table.Thead>
									<Table.Tr>
										<Table.Th>Name</Table.Th>
										<Table.Th>Instance</Table.Th>
										<Table.Th>Region</Table.Th>
										<Table.Th>Version</Table.Th>
										<Table.Th w={0}>Actions</Table.Th>
									</Table.Tr>
								</Table.Thead>
								<Table.Tbody>
									{instanceList.map((element) => (
										<Instance
											key={element.id}
											value={element}
											type="row"
											onDelete={refetch}
											onConnect={handleConnect}
											onOpenSettings={handleSettings}
										/>
									))}
								</Table.Tbody>
							</Table>
						)}
					</ScrollArea>
				</Box>
			)}

			<ConnectCliModal
				opened={showCliConnect}
				instance={selectedInstance}
				onClose={cliConnectHandle.close}
			/>

			<ConnectSdkModal
				opened={showSdkConnect}
				instance={selectedInstance}
				onClose={sdkConnectHandle.close}
			/>

			<SettingsModal
				opened={showSettings}
				instance={selectedInstance}
				onClose={settingsHandle.close}
				onRefetch={refetch}
			/>
		</>
	);
}
