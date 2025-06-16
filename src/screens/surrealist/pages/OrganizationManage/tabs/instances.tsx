import { Button, SimpleGrid, Skeleton } from "@mantine/core";
import { Link } from "wouter";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { Section } from "~/components/Section";
import { useAbsoluteLocation, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { StartCreator } from "../../Overview/content/creator";
import { StartInstance } from "../../Overview/content/instance";
import { StartPlaceholder } from "../../Overview/content/placeholder";
import { OrganizationTabProps } from "../types";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OrganizationInstancesTab({ organization }: OrganizationTabProps) {
	const [, navigate] = useAbsoluteLocation();
	const navigateConnection = useConnectionNavigator();
	const { data, isSuccess, isPending } = useCloudOrganizationInstancesQuery(organization.id);
	const isAdmin = useHasOrganizationRole(organization.id, "admin");
	const instances = isSuccess ? data : [];
	const isArchived = !!organization.archived_at;
	const canCreate = isSuccess && instances.length === 0 && !isArchived && isAdmin;

	const activateInstance = useStable((instance: CloudInstance) => {
		navigateConnection(resolveInstanceConnection(instance).id);
	});

	return (
		<Section
			title="Instances"
			description="The list of instances that are part of this organisation"
			rightSection={
				isAdmin && (
					<Link href={`/o/${organization.id}/deploy`}>
						<Button
							size="xs"
							disabled={isArchived}
							variant="gradient"
						>
							Deploy instance
						</Button>
					</Link>
				)
			}
		>
			<SimpleGrid cols={GRID_COLUMNS}>
				{isPending && <Skeleton h={112} />}
				{instances.map((instance) => (
					<StartInstance
						key={instance.id}
						instance={instance}
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
	);
}
