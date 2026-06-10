import { Paper, Stack } from "@mantine/core";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import type { CloudInstance, CloudOrganization } from "~/types";
import { ConfigurationCapabilities } from "../../views/dashboard/ConfiguratorDrawer/configs/capabilities";
import { ConfigurationNetwork } from "../../views/dashboard/ConfiguratorDrawer/configs/network";
import { ConfigurationVersion } from "../../views/dashboard/ConfiguratorDrawer/configs/version";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionConfigurationTab({
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;

	if (!instance || !organisation) {
		return null;
	}

	return (
		<ConfigurationContent
			instance={instance}
			organisation={organisation}
		/>
	);
}

interface ConfigurationContentProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
}

function ConfigurationContent({ instance, organisation }: ConfigurationContentProps) {
	const { mutateAsync } = useUpdateInstanceVersionMutation(instance);
	const handleUpdate = useUpdateConfirmation(mutateAsync);

	const onUpdate = useStable((version: string) => {
		handleUpdate(version);
	});

	const isAdmin = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
	const isIdle = instance.state !== "ready" && instance.state !== "paused";

	if (!isAdmin || isIdle) {
		return (
			<Stack>
				<PrimaryTitle fz={32}>Configuration</PrimaryTitle>
				<Section title="Unavailable">
					<Paper p="md">
						Instance configuration is unavailable while the instance is not ready or you
						lack admin permissions.
					</Paper>
				</Section>
			</Stack>
		);
	}

	return (
		<Stack>
			<PrimaryTitle fz={32}>Configuration</PrimaryTitle>

			<Section
				title="Capabilities"
				description="Configure SurrealDB capability flags for this instance"
			>
				<Paper p="md">
					<ConfigurationCapabilities
						instance={instance}
						onClose={() => {}}
					/>
				</Paper>
			</Section>

			<Section
				title="Version"
				description="Update your instance to a newer SurrealDB version"
			>
				<Paper p="md">
					<ConfigurationVersion
						instance={instance}
						onUpdate={onUpdate}
						onClose={() => {}}
					/>
				</Paper>
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
