import {
	Anchor,
	Badge,
	Button,
	Center,
	Group,
	Indicator,
	Loader,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from "@mantine/core";
import { Icon, iconDatabase } from "@surrealdb/ui";
import { Link } from "wouter";
import { hasOrganizationRoles, isOrganisationRestricted, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationDataStoresQuery } from "~/cloud/queries/datastores";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { Section } from "~/components/Section";
import { Spacer } from "~/components/Spacer";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudDataStore, CloudInstance, DataStoreState } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { StartCreator } from "../../Overview/content/creator";
import { StartInstance } from "../../Overview/content/instance";
import { StartPlaceholder } from "../../Overview/content/placeholder";
import type { OrganizationTabProps } from "../types";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

const STATE_INFO: Record<DataStoreState, [string, string]> = {
	ready: ["green", "Data store is active"],
	creating: ["loader", "Provisioning data store..."],
	deleting: ["red", "Data store is being removed"],
};

function DataStoreStateBadge({ state, size }: { state: DataStoreState; size: number }) {
	const [display, text] = STATE_INFO[state];

	return (
		<Center
			w={size}
			h={size}
		>
			<Tooltip label={text}>
				{display !== "loader" ? (
					<Indicator
						processing={state === "ready"}
						color={display}
						size={size}
					/>
				) : (
					<Loader
						size={size}
						style={{ transform: "scale(1.5)" }}
					/>
				)}
			</Tooltip>
		</Center>
	);
}

function DataStoreCard({
	dataStore,
	regions,
}: {
	dataStore: CloudDataStore;
	regions: { slug: string; description: string }[];
}) {
	return (
		<Anchor
			variant="glow"
			c="var(--mantine-color-text)"
		>
			<Paper p="lg">
				<Group
					wrap="nowrap"
					align="strech"
					mt={-3}
				>
					<Group
						gap="lg"
						wrap="nowrap"
					>
						<ThemeIcon
							color="obsidian"
							variant="light"
							size="xl"
						>
							<Icon
								size="md"
								path={iconDatabase}
							/>
						</ThemeIcon>
						<Stack
							gap="xs"
							miw={0}
						>
							<Group
								miw={0}
								wrap="nowrap"
							>
								<Text
									c="bright"
									fw={600}
									fz="xl"
									truncate
								>
									{dataStore.name}
								</Text>
								<DataStoreStateBadge
									size={10}
									state={dataStore.state}
								/>
							</Group>
							<Text>SurrealDB {dataStore.version}</Text>
							<Text size="sm">
								{regions.find((r) => r.slug === dataStore.region)?.description ??
									dataStore.region}
							</Text>
						</Stack>
					</Group>
					<Spacer />
					<Badge
						color="violet"
						variant="light"
					>
						Data Store
					</Badge>
				</Group>
			</Paper>
		</Anchor>
	);
}

export function OrganizationOverviewTab({ organization }: OrganizationTabProps) {
	const navigateConnection = useConnectionNavigator();
	const allRegions = useCloudStore((s) => s.regions);
	const isAdmin = hasOrganizationRoles(organization, ORG_ROLES_ADMIN);
	const isRestricted = isOrganisationRestricted(organization);

	const {
		data: instanceData,
		isSuccess: instancesLoaded,
		isPending: instancesPending,
	} = useCloudOrganizationInstancesQuery(organization.id);

	const {
		data: dataStoreData,
		isSuccess: dataStoresLoaded,
		isPending: dataStoresPending,
	} = useCloudOrganizationDataStoresQuery(organization.id);

	const instances = instancesLoaded ? instanceData : [];
	const dataStores = dataStoresLoaded ? dataStoreData : [];
	const canCreate = instancesLoaded && instances.length === 0 && !isRestricted && isAdmin;

	const activateInstance = useStable((instance: CloudInstance) => {
		navigateConnection(resolveInstanceConnection(instance).id);
	});

	return (
		<>
			<Section
				title="Instances"
				description="All cloud instances deployed in this organization."
				rightSection={
					isAdmin && (
						<Link href={`/o/${organization.id}/deploy`}>
							<Button
								size="xs"
								disabled={isRestricted}
								variant="gradient"
							>
								Deploy instance
							</Button>
						</Link>
					)
				}
			>
				<SimpleGrid cols={GRID_COLUMNS}>
					{instancesPending && <Skeleton h={112} />}
					{instances.map((instance) => (
						<StartInstance
							key={instance.id}
							instance={instance}
							regions={allRegions}
							organisation={organization}
							onConnect={activateInstance}
						/>
					))}
					{canCreate &&
						(isAdmin ? (
							<StartCreator organization={organization.id} />
						) : (
							<StartPlaceholder
								title="No instances"
								subtitle="This organisation has no instances"
							/>
						))}
				</SimpleGrid>
			</Section>

			<Section
				title="Data Stores"
				description="Managed data stores deployed in this organisation."
			>
				<SimpleGrid cols={GRID_COLUMNS}>
					{dataStoresPending && <Skeleton h={112} />}
					{dataStores.map((ds) => (
						<DataStoreCard
							key={ds.id}
							dataStore={ds}
							regions={allRegions}
						/>
					))}
					{dataStoresLoaded && dataStores.length === 0 && (
						<StartPlaceholder
							title="No data stores"
							subtitle="This organisation has no data stores"
						/>
					)}
				</SimpleGrid>
			</Section>
		</>
	);
}
