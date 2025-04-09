import { Button, SimpleGrid, Skeleton } from "@mantine/core";
import { Link } from "wouter";
import { createInstancePath } from "~/cloud/helpers";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { Section } from "~/components/Section";
import { useAbsoluteLocation, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { StartCreator } from "../../Overview/content/creator";
import { StartInstance } from "../../Overview/content/instance";
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

	const activateInstance = useStable((instance: CloudInstance) => {
		navigateConnection(resolveInstanceConnection(instance).id);
	});

	return (
		<Section
			title="Instances"
			description="The list of instances that are part of this organization"
			rightSection={
				isAdmin && (
					<Link href={createInstancePath(organization)}>
						<Button
							size="xs"
							disabled={isArchived}
							variant="gradient"
						>
							New instance
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
				{isSuccess && instances.length === 0 && !isArchived && (
					<StartCreator
						title="No instances"
						subtitle="Click to provision a new instance"
						onCreate={() => navigate(createInstancePath(organization))}
					/>
				)}
			</SimpleGrid>
		</Section>
	);
}
