import {
	Anchor,
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
import { Icon, iconSpectron } from "@surrealdb/ui";
import { useMemo } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, isOrganisationRestricted, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationContextsQuery } from "~/cloud/queries/datastores";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useHasCloudFeature } from "~/hooks/cloud";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudContext, CloudInstance, ContextState } from "~/types";
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

const STATE_INFO: Record<ContextState, [string, string]> = {
	ready: ["green", "Data store is active"],
	creating: ["loader", "Provisioning data store..."],
	deleting: ["red", "Data store is being removed"],
};

function DataStoreStateBadge({ state, size }: { state: ContextState; size: number }) {
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
	dataStore: CloudContext;
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
								size="xl"
								path={iconSpectron}
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
							{/* <Text>SurrealDB {dataStore.version}</Text> */}
							<Text size="sm">
								{regions.find((r) => r.slug === dataStore.region)?.description ??
									dataStore.region}
							</Text>
						</Stack>
					</Group>
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
	const showContexts = useHasCloudFeature("create_memory_store");

	const {
		data: instanceData,
		isSuccess: instancesLoaded,
		isPending: instancesPending,
	} = useCloudOrganizationInstancesQuery(organization.id);

	const {
		data: contextData,
		isSuccess: contextsLoaded,
		isPending: contextsPending,
	} = useCloudOrganizationContextsQuery(organization.id);

	const instances = instancesLoaded ? instanceData : [];
	const contexts = contextsLoaded ? contextData : [];
	const canCreate = instancesLoaded && instances.length === 0 && !isRestricted && isAdmin;

	const sortedInstances = useMemo(() => {
		return instances.sort((a, b) => statusComparator(a, b) || a.name.localeCompare(b.name));
	}, [instances]);

	const sortedContexts = useMemo(() => {
		return contexts.sort((a, b) => a.name.localeCompare(b.name));
	}, [contexts]);

	const activateInstance = useStable((instance: CloudInstance) => {
		navigateConnection(resolveInstanceConnection(instance).id);
	});

	return (
		<>
			<PrimaryTitle fz={32}>Overview</PrimaryTitle>
			<Section
				title="Instances"
				description="SurrealDB instances deployed in this organization."
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
					{sortedInstances.map((instance) => (
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

			{showContexts && (
				<Section
					title="Contexts"
					description="Spectron contexts deployed in this organisation."
					rightSection={
						isAdmin && (
							<Link href={`/o/${organization.id}/context/deploy`}>
								<Button
									size="xs"
									disabled={isRestricted}
									variant="gradient"
								>
									Create context
								</Button>
							</Link>
						)
					}
				>
					<SimpleGrid cols={GRID_COLUMNS}>
						{contextsPending && <Skeleton h={112} />}
						{sortedContexts.map((ds) => (
							<DataStoreCard
								key={ds.id}
								dataStore={ds}
								regions={allRegions}
							/>
						))}
						{contextsLoaded && contexts.length === 0 && (
							<StartPlaceholder
								title="No contexts"
								subtitle="This organisation has no contexts"
							/>
						)}
					</SimpleGrid>
				</Section>
			)}
		</>
	);
}

function statusComparator(a: CloudInstance | CloudContext, b: CloudInstance | CloudContext) {
	if (a.state === "paused" && b.state !== "paused") return 1;
	if (a.state !== "paused" && b.state === "paused") return -1;
	return 0;
}
