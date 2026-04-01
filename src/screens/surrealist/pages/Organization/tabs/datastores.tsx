import {
	Anchor,
	Badge,
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
import { useCloudOrganizationDataStoresQuery } from "~/cloud/queries/datastores";
import { Section } from "~/components/Section";
import { Spacer } from "~/components/Spacer";
import { useCloudStore } from "~/stores/cloud";
import type { CloudDataStore, DataStoreState } from "~/types";
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
					<Group gap="lg">
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
						<Stack gap="xs">
							<Group>
								<Text
									c="bright"
									fw={600}
									fz="xl"
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

export function OrganizationDataStoresSection({ organization }: OrganizationTabProps) {
	const { data, isSuccess, isPending } = useCloudOrganizationDataStoresQuery(organization.id);
	const allRegions = useCloudStore((s) => s.regions);
	const dataStores = isSuccess ? data : [];

	return (
		<Section
			title="Data Stores"
			description="Managed data stores deployed in this organisation."
		>
			<SimpleGrid cols={GRID_COLUMNS}>
				{isPending && <Skeleton h={112} />}
				{dataStores.map((ds) => (
					<DataStoreCard
						key={ds.id}
						dataStore={ds}
						regions={allRegions}
					/>
				))}
				{isSuccess && dataStores.length === 0 && (
					<StartPlaceholder
						title="No data stores"
						subtitle="This organisation has no data stores"
					/>
				)}
			</SimpleGrid>
		</Section>
	);
}
