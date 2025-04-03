import { Paper, Stack } from "@mantine/core";
import { OrganizationTabProps } from "../types";
import { Section } from "~/components/Section";

export function OrganizationTeamTab({ organization }: OrganizationTabProps) {
	return (
		<Stack>
			<Section
				title="Team members"
				description="Manage the members of your organization"
			>
				<Paper p="md">test</Paper>
			</Section>
			<Section
				title="Pending invitations"
				description="View or revoke pending invitations"
			>
				<Paper p="md">test</Paper>
			</Section>
		</Stack>
	);
}
