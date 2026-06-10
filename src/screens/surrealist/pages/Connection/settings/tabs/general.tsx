import { Paper, Stack } from "@mantine/core";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { ConnectionDetailsReadout, ConnectionForm } from "../sections/connection-form";
import { InstanceDetailsSection } from "../sections/instance-details";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionGeneralTab({
	connection,
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;

	return (
		<Stack>
			<PrimaryTitle fz={32}>General</PrimaryTitle>

			<Section
				title="Connection settings"
				description="General configuration for this connection"
			>
				<Paper p="md">
					<ConnectionDetailsReadout connection={connection} />
				</Paper>
			</Section>

			<ConnectionForm value={connection} />

			{instance && organisation && (
				<InstanceDetailsSection
					instance={instance}
					organisation={organisation}
				/>
			)}
		</Stack>
	);
}
