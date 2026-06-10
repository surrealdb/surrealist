import { Button, Group, SimpleGrid, Stack, Text } from "@mantine/core";
import { Icon, iconHistory } from "@surrealdb/ui";
import dayjs from "dayjs";
import { useState } from "react";
import { navigate } from "wouter/use-browser-location";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { BackupRetention } from "../../views/dashboard/BackupsDrawer/BackupRetention";
import { InstanceBackup } from "../../views/dashboard/BackupsDrawer/InstanceBackup";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionBackupsTab({
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;
	const [selected, setSelected] = useState<string | undefined>(undefined);

	const { data: backups } = useCloudBackupsQuery(instance?.id);

	const handleRestore = useStable(() => {
		if (selected && instance) {
			const params = new URLSearchParams();

			params.set("backupId", selected);
			params.set("instanceId", instance.id);
			const path = `/o/${instance.organization_id}/instances/deploy?${params.toString()}`;

			navigate(path);
		}
	});

	if (!instance) {
		return null;
	}

	const isAdmin = organisation ? hasOrganizationRoles(organisation, ORG_ROLES_ADMIN) : false;

	return (
		<Stack>
			<PrimaryTitle fz={32}>Backups</PrimaryTitle>

			<Section
				title="Available backups"
				description="Create a new instance from a backup snapshot"
			>
				{!backups?.length ? (
					<Stack
						align="center"
						py="xl"
						gap="xs"
					>
						<Icon path={iconHistory} />
						<Text
							fz="lg"
							c="bright"
							fw={600}
						>
							No backups available
						</Text>
						<Text>There are no backups available for this instance.</Text>
					</Stack>
				) : (
					<SimpleGrid cols={{ base: 1, xs: 2, md: 3 }}>
						{backups
							.slice()
							.sort((a, b) => {
								const dateA = dayjs(a.snapshot_started_at);
								const dateB = dayjs(b.snapshot_started_at);

								return dateB.valueOf() - dateA.valueOf();
							})
							.map((backup) => (
								<InstanceBackup
									key={backup.snapshot_id}
									selected={selected === backup.snapshot_id}
									backup={backup}
									onSelect={() => setSelected(backup.snapshot_id)}
								/>
							))}
					</SimpleGrid>
				)}

				{isAdmin && backups && backups.length > 0 && (
					<Group mt="md">
						<Button
							variant="gradient"
							disabled={!selected}
							onClick={handleRestore}
						>
							Create from selected
						</Button>
					</Group>
				)}
			</Section>

			<Section
				title="Retention policy"
				description="Configure how long backups are retained"
			>
				<BackupRetention
					instance={instance}
					variant="page"
				/>
			</Section>
		</Stack>
	);
}
