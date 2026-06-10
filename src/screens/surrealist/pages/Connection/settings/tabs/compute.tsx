import { Box, Paper, Stack } from "@mantine/core";
import { useRef } from "react";
import { hasOrganizationRoles, INSTANCE_CATEGORY_PLANS, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { ConfigurationNodes } from "../sections/compute/nodes";
import { ConfigurationStorage } from "../sections/compute/storage";
import { ConfigurationInstanceType } from "../sections/compute/type";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionComputeTab({
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;
	const instanceTypeRef = useRef<HTMLDivElement>(null);

	const scrollToInstanceType = useStable(() => {
		instanceTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
	});

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
				<PrimaryTitle fz={32}>Instance configuration</PrimaryTitle>
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
			<PrimaryTitle fz={32}>Instance configuration</PrimaryTitle>

			<Box ref={instanceTypeRef}>
				<ConfigurationInstanceType
					instance={instance}
					organisation={organisation}
					variant="page"
					onClose={() => {}}
				/>
			</Box>

			<Box mt="xl">
				<Section
					title="Storage capacity"
					description="Increase the storage limit for this instance"
				>
					<ConfigurationStorage
						instance={instance}
						variant="page"
						onClose={() => {}}
						onUpgrade={scrollToInstanceType}
					/>
				</Section>
			</Box>

			{showComputeNodes && (
				<Box mt="xl">
					<Section
						title="Compute nodes"
						description="Configure dedicated compute nodes for scale deployments"
					>
						<ConfigurationNodes
							instance={instance}
							variant="page"
							onClose={() => {}}
						/>
					</Section>
				</Box>
			)}
		</Stack>
	);
}
