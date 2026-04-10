import { Button, Group, Select, SimpleGrid, Skeleton, TextInput } from "@mantine/core";
import { Icon, iconSearch } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, isOrganisationRestricted, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudInstance } from "~/types";
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

function statusComparator(a: CloudInstance, b: CloudInstance) {
	if (a.state === "paused" && b.state !== "paused") return 1;
	if (a.state !== "paused" && b.state === "paused") return -1;
	return 0;
}

export function OrganizationInstancesTab({ organization }: OrganizationTabProps) {
	const navigateConnection = useConnectionNavigator();
	const allRegions = useCloudStore((s) => s.regions);
	const isAdmin = hasOrganizationRoles(organization, ORG_ROLES_ADMIN);
	const isRestricted = isOrganisationRestricted(organization);

	const [search, setSearch] = useState("");
	const [regionFilter, setRegionFilter] = useState<string | null>(null);

	const {
		data: instanceData,
		isSuccess: instancesLoaded,
		isPending: instancesPending,
	} = useCloudOrganizationInstancesQuery(organization.id);

	const instances = instancesLoaded ? instanceData : [];
	const canCreate = instancesLoaded && instances.length === 0 && !isRestricted && isAdmin;

	const regionOptions = useMemo(() => {
		const usedRegions = new Set(instances.map((i) => i.region));

		return allRegions
			.filter((r) => usedRegions.has(r.slug))
			.map((r) => ({ label: r.description, value: r.slug }));
	}, [allRegions, instances]);

	const filteredInstances = useMemo(() => {
		return instances
			.filter((instance) => {
				if (search && !instance.name.toLowerCase().includes(search.toLowerCase())) {
					return false;
				}

				if (regionFilter && instance.region !== regionFilter) {
					return false;
				}

				return true;
			})
			.sort((a, b) => statusComparator(a, b) || a.name.localeCompare(b.name));
	}, [instances, search, regionFilter]);

	const activateInstance = useStable((instance: CloudInstance) => {
		navigateConnection(resolveInstanceConnection(instance).id);
	});

	return (
		<>
			<Group
				justify="space-between"
				align="flex-end"
			>
				<PrimaryTitle fz={32}>Instances</PrimaryTitle>
				{isAdmin && (
					<Link href={`/o/${organization.id}/instances/deploy`}>
						<Button
							size="xs"
							disabled={isRestricted}
							variant="gradient"
						>
							Deploy instance
						</Button>
					</Link>
				)}
			</Group>

			<Group mt="lg">
				<TextInput
					placeholder="Search instances..."
					leftSection={<Icon path={iconSearch} />}
					value={search}
					onChange={(e) => setSearch(e.currentTarget.value)}
					style={{ flex: 1 }}
				/>
				{regionOptions.length > 1 && (
					<Select
						placeholder="All regions"
						data={regionOptions}
						value={regionFilter}
						onChange={setRegionFilter}
						clearable
						w={220}
					/>
				)}
			</Group>

			<SimpleGrid
				cols={GRID_COLUMNS}
				mt="lg"
			>
				{instancesPending && <Skeleton h={112} />}
				{filteredInstances.map((instance) => (
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
				{instancesLoaded &&
					instances.length > 0 &&
					filteredInstances.length === 0 &&
					(search || regionFilter) && (
						<StartPlaceholder
							title="No matching instances"
							subtitle="Try adjusting your search or filter"
						/>
					)}
			</SimpleGrid>
		</>
	);
}
