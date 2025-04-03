import { Paper, Stack, TextInput } from "@mantine/core";
import { OrganizationTabProps } from "../types";
import { Section } from "~/components/Section";

export function OrganizationInstancesTab({ organization }: OrganizationTabProps) {
	return (
		<Section
			title="Instances"
			description="The list of instances that are part of this organization"
		>
			<Paper p="md">test</Paper>
		</Section>
	);
}
