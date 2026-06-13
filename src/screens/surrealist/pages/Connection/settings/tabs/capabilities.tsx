import { Paper, Stack } from "@mantine/core";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import type { CloudInstance, CloudOrganization } from "~/types";
import { ConfigurationCapabilities } from "../sections/capabilities/capabilities";
import { ConfigurationNetwork } from "../sections/capabilities/network";
import { CapabilitiesImportExport } from "../sections/capabilities-import-export";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionCapabilitiesTab({
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;

	if (!instance || !organisation) {
		return null;
	}

	return (
		<CapabilitiesContent
			instance={instance}
			organisation={organisation}
		/>
	);
}

interface CapabilitiesContentProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
}

function CapabilitiesContent({ instance, organisation }: CapabilitiesContentProps) {
	const isAdmin = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
	const isIdle = instance.state !== "ready" && instance.state !== "paused";

	if (!isAdmin || isIdle) {
		return (
			<Stack>
				<PrimaryTitle fz={32}>Capabilities</PrimaryTitle>
				<Section title="Unavailable">
					<Paper p="md">
						Instance capabilities are unavailable while the instance is loading
					</Paper>
				</Section>
			</Stack>
		);
	}

	return (
		<Stack>
			<PrimaryTitle fz={32}>Capabilities</PrimaryTitle>

			<Section
				title="Import & export from file"
				description="Save or restore your instance's capabilities configuration to or from a json file"
			>
				<CapabilitiesImportExport instance={instance} />
			</Section>

			<Section
				title="Granular configuration"
				description="Configure SurrealDB capability flags for this instance"
			>
				<ConfigurationCapabilities
					instance={instance}
					variant="page"
					onClose={() => {}}
				/>
			</Section>

			{organisation.privatelink_enabled && (
				<Section
					title="Network"
					description="Configure public and private network access"
				>
					<Paper p="md">
						<ConfigurationNetwork
							instance={instance}
							onClose={() => {}}
						/>
					</Paper>
				</Section>
			)}
		</Stack>
	);
}
