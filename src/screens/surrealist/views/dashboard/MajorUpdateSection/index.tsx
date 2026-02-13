import { Box, Paper, Text } from "@mantine/core";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudInstance, CloudOrganization } from "~/types";

export interface MajorUpdateSectionProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
	// isLoading: boolean;
	// onUpdate: (version: string) => void;
	// onVersions: () => void;
}

export function MajorUpdateSection({
	instance,
	organisation,
	// isLoading,
	// onUpdate,
	// onVersions,
}: MajorUpdateSectionProps) {
	const canUpdate = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);

	const handleUpdate = useStable(() => {
		// onUpdate(latest);
	});

	const showUpdate = canUpdate && instance.version;

	return (
		showUpdate && (
			<>
				<Box mt={32}>
					<PrimaryTitle>Update available</PrimaryTitle>
					<Text>Customise and connect to your SurrealDB Cloud instance</Text>
				</Box>
				<Paper />
			</>
		)
	);
}
