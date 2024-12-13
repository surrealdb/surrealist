import classes from "./style.module.scss";

import {
	ActionIcon,
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
	iconCheck,
	iconOpen,
	iconPlus,
	iconSearch,
	iconTune,
	iconViewGrid,
	iconViewList,
} from "~/util/icons";

import { useDebouncedValue, useInputState } from "@mantine/hooks";
import { Fragment, useMemo, useState } from "react";
import { FloatingButton } from "~/components/FloatingButton";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useAvailableInstanceTypes, useAvailableRegions, useOrganization } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useActiveCloudPage, useActiveView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { CloudInstance } from "~/types";
import { createBaseConnection } from "~/util/defaults";
import { fuzzyMatch } from "~/util/helpers";
import { type ConnectMethod, Instance } from "../../components/Instance";
import { useCloudInstancesQuery } from "../../hooks/instances";
import { openConnectCli } from "../../modals/connect-cli";
import { openConnectCurl } from "../../modals/connect-curl";
import { openConnectSdk } from "../../modals/connect-sdk";
import { ActionButton } from "~/components/ActionButton";

interface Filter {
	type: string;
	value: string;
	label: string;
}

export function InstancesPage() {
	const { addConnection, setActiveConnection } = useConfigStore.getState();

	const [search, setSearch] = useInputState("");
	const [filter, setFilter] = useState<Filter | null>(null);
	const [searchQuery] = useDebouncedValue(search, 150);
	const [, setActiveView] = useActiveView();
	const [, setActivePage] = useActiveCloudPage();

	const regions = useAvailableRegions();
	const organization = useOrganization();
	const instanceTypes = useAvailableInstanceTypes();

	const { data, isPending, refetch } = useCloudInstancesQuery(organization?.id);

	const instances = useMemo(() => data || [], [data]);

	const handleProvision = useStable(() => {
		setActivePage("provision");
	});

	const handleConnect = useStable((method: ConnectMethod, db: CloudInstance) => {
		if (method === "surrealist") {
			const { connections, settings } = useConfigStore.getState();

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
			openConnectSdk(db);
		} else if (method === "cli") {
			openConnectCli(db);
		} else if (method === "curl") {
			openConnectCurl(db);
		}
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
				<Group
					gap="lg"
					mb="xl"
					wrap="nowrap"
				>
					<Button
						variant="gradient"
						leftSection={<Icon path={iconPlus} />}
						onClick={handleProvision}
						visibleFrom="xs"
						radius="sm"
						size="xs"
					>
						Create instance
					</Button>
					<Spacer visibleFrom="xs" />
					<Menu>
						<Menu.Target>
							<Indicator
								disabled={!filter}
								color="blue"
								size={7}
							>
								<ActionButton
									variant="subtle"
									color="slate"
									label="Filter instances"
									disabled={instances.length === 0}
								>
									<Icon path={iconTune} />
								</ActionButton>
							</Indicator>
						</Menu.Target>
						<Menu.Dropdown miw={150}>
							{filterTypes.map((type) => (
								<Fragment key={type.title}>
									<Menu.Label>{type.title}</Menu.Label>
									{type.options.map((option) => {
										const isActive = filter?.value === option.value;

										return (
											<Menu.Item
												key={option.value}
												onClick={() => setFilter(isActive ? null : option)}
												rightSection={isActive && <Icon path={iconCheck} />}
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
						leftSection={
							<Icon
								path={iconSearch}
								size="sm"
							/>
						}
						radius="sm"
						size="xs"
						className={classes.search}
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
						<Paper
							radius="md"
							p="xl"
							w={500}
						>
							<PrimaryTitle>Create your first instance</PrimaryTitle>
							<Text mt="xl">
								This organization does not have any instances yet. Create your first
								instance to get started with Surreal Cloud.
							</Text>
							<Group>
								<Link href="https://surrealdb.com/docs/cloud/getting-started/create-an-instance">
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
								</Link>
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
				<Box
					mt={150}
					c="slate"
					fz="lg"
					ta="center"
				>
					No matching instances found
				</Box>
			) : (
				<Box
					flex={1}
					pos="relative"
				>
					<ScrollArea
						pos="absolute"
						scrollbars="y"
						inset={0}
					>
						{mode === "grid" ? (
							<SimpleGrid
								cols={{ xs: 1, md: 2, lg: 2, xl: 3 }}
								spacing="xl"
							>
								{instanceList.map((db) => (
									<Instance
										key={db.id}
										value={db}
										type="card"
										onDelete={refetch}
										onConnect={handleConnect}
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
										/>
									))}
								</Table.Tbody>
							</Table>
						)}
					</ScrollArea>
				</Box>
			)}

			<FloatingButton
				icon={iconPlus}
				hiddenFrom="xs"
				onClick={handleProvision}
			/>
		</>
	);
}

export default InstancesPage;
