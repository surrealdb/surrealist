import { Paper, Stack } from "@mantine/core";
import { hasOrganizationRoles, INSTANCE_CATEGORY_PLANS, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { ConfigurationNodes } from "../../views/dashboard/UpgradeDrawer/configs/nodes";
import { ConfigurationStorage } from "../../views/dashboard/UpgradeDrawer/configs/storage";
import { ConfigurationInstanceType } from "../../views/dashboard/UpgradeDrawer/configs/type";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionComputeTab({
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;

	if (!instance || !organisation) {
		return null;
	}

	const isAdmin = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
	const isIdle = instance.state !== "ready" && instance.state !== "paused";
	const guessedPlan = INSTANCE_CATEGORY_PLANS[instance.type.category];
	const showComputeNodes = guessedPlan === "scale" || guessedPlan === "enterprise";

	if (!isAdmin || isIdle) {
		return (
			<Stack>
				<PrimaryTitle fz={32}>Compute & storage</PrimaryTitle>
				<Section title="Unavailable">
					<Paper p="md">
						Instance upgrades are unavailable while the instance is not ready or you
						lack admin permissions.
					</Paper>
				</Section>
			</Stack>
		);
	}

	return (
		<Stack>
			<PrimaryTitle fz={32}>Compute & storage</PrimaryTitle>

			<Section
				title="Instance type"
				description="Change your instance plan or compute tier"
			>
				<Paper p="md">
					<ConfigurationInstanceType
						instance={instance}
						organisation={organisation}
						onClose={() => {}}
					/>
				</Paper>
			</Section>

			<Section
				title="Storage capacity"
				description="Increase the storage limit for this instance"
			>
				<Paper p="md">
					<ConfigurationStorage
						instance={instance}
						onClose={() => {}}
						onUpgrade={() => {}}
					/>
				</Paper>
			</Section>

			{showComputeNodes && (
				<Section
					title="Compute nodes"
					description="Configure dedicated compute nodes for scale deployments"
				>
					<Paper p="md">
						<ConfigurationNodes
							instance={instance}
							onClose={() => {}}
						/>
					</Paper>
				</Section>
			)}
		</Stack>
	);
}
