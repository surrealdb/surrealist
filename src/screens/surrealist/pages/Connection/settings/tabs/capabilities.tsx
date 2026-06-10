import { Paper, Stack } from "@mantine/core";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import type { CloudInstance, CloudOrganization } from "~/types";
import { ConfigurationCapabilities } from "../../views/dashboard/ConfiguratorDrawer/configs/capabilities";
import { ConfigurationNetwork } from "../../views/dashboard/ConfiguratorDrawer/configs/network";
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
				title="Capabilities"
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
