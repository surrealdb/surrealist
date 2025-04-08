import { Button, SimpleGrid } from "@mantine/core";
import { OrganizationTabProps } from "../types";
import { Section } from "~/components/Section";
import { StartCreator } from "../../Overview/content/creator";
import { StartInstance } from "../../Overview/content/instance";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { useAbsoluteLocation, useConnectionNavigator } from "~/hooks/routing";
import { resolveInstanceConnection } from "~/util/connection";
import { useStable } from "~/hooks/stable";
import { CloudInstance } from "~/types";
import { Link } from "wouter";
import { useHasOrganizationWriteAccess } from "~/cloud/hooks/role";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OrganizationInstancesTab({ organization }: OrganizationTabProps) {
	const [, navigate] = useAbsoluteLocation();
	const navigateConnection = useConnectionNavigator();
	const { data, isSuccess } = useCloudOrganizationInstancesQuery(organization.id);
	const canModify = useHasOrganizationWriteAccess(organization.id);
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
				canModify && (
					<Link href="/create/instance">
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
				{instances.map((instance) => (
					<StartInstance
						key={instance.id}
						instance={instance}
						onConnect={activateInstance}
					/>
				))}
				{instances.length === 0 && (
					<StartCreator
						title="No instances"
						subtitle="Click to provision a new instance"
						onCreate={() => {
							navigate("/create/instance");
						}}
					/>
				)}
			</SimpleGrid>
		</Section>
	);
}
