import { Box, Button, Group, Paper, Stack, Text } from "@mantine/core";
import { Icon, iconDelete, iconPause, iconPlay } from "@surrealdb/ui";
import { hasOrganizationRoles, ORG_ROLES_ADMIN, ORG_ROLES_OWNER } from "~/cloud/helpers";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useDeleteInstance, usePauseInstance, useResumeInstance } from "~/hooks/cloud";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import type { CloudInstance, CloudOrganization } from "~/types";
import type { ConnectionSettingsTabProps } from "../types";

export function ConnectionLifecycleTab({
	instanceQuery,
	organisationQuery,
}: ConnectionSettingsTabProps) {
	const instance = instanceQuery.data;
	const organisation = organisationQuery.data;

	if (!instance || !organisation) {
		return null;
	}

	return (
		<Stack>
			<PrimaryTitle fz={32}>Lifecycle</PrimaryTitle>

			<Section
				title="Instance state"
				description="Current operational state of your cloud instance"
			>
				<Paper p="md">
					<Group gap="sm">
						<StateBadge
							size={14}
							state={instance.state}
						/>
						<Text className="selectable">{instance.name}</Text>
					</Group>
				</Paper>
			</Section>

			<LifecycleActions
				instance={instance}
				organisation={organisation}
			/>
		</Stack>
	);
}

interface LifecycleActionsProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
}

function LifecycleActions({ instance, organisation }: LifecycleActionsProps) {
	const connections = useConnectionList();

	const cloudConnection = connections.find((c) => c.authentication.cloudInstance === instance.id);

	const isAdmin = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);
	const canResume = hasOrganizationRoles(organisation, ORG_ROLES_OWNER);

	const pauseInstance = usePauseInstance(instance);
	const resumeInstance = useResumeInstance(instance);
	const deleteInstance = useDeleteInstance(instance, cloudConnection);

	const handlePause = useStable(() => {
		if (organisation.resources_locked) {
			openResourcesLockedModal(organisation);
		} else {
			pauseInstance();
		}
	});

	const handleResume = useStable(() => {
		if (organisation.resources_locked) {
			openResourcesLockedModal(organisation);
		} else {
			resumeInstance();
		}
	});

	const handleDelete = useStable(() => {
		if (organisation.resources_locked) {
			openResourcesLockedModal(organisation);
		} else {
			deleteInstance();
		}
	});

	const isReady = instance.state === "ready";
	const isPaused = instance.state === "paused";

	if (!isAdmin || (!isReady && !isPaused)) {
		return null;
	}

	return (
		<Section
			title="Instance availability"
			description="Pause, resume, or permanently delete this instance"
		>
			<Paper p="md">
				<Stack gap="lg">
					{isReady && (
						<Group justify="space-between">
							<Box maw={480}>
								<Text
									fw={600}
									c="bright"
								>
									Pause instance
								</Text>
								<Text fz="sm">
									Temporarily stop compute while preserving your data.
								</Text>
							</Box>
							<Button
								size="xs"
								variant="light"
								color="obsidian"
								leftSection={<Icon path={iconPause} />}
								onClick={handlePause}
							>
								Pause instance
							</Button>
						</Group>
					)}

					{isPaused && (
						<Group justify="space-between">
							<Box maw={480}>
								<Text
									fw={600}
									c="bright"
								>
									Resume instance
								</Text>
								<Text fz="sm">
									Bring your instance back online to continue working.
								</Text>
							</Box>
							<Button
								size="xs"
								variant="gradient"
								disabled={!canResume}
								leftSection={<Icon path={iconPlay} />}
								onClick={handleResume}
							>
								Resume instance
							</Button>
						</Group>
					)}

					{isReady && (
						<Group justify="space-between">
							<Box maw={480}>
								<Text
									fw={600}
									c="bright"
								>
									Delete instance
								</Text>
								<Text
									fz="sm"
									className="selectable"
								>
									Permanently remove this instance and all associated data.
								</Text>
							</Box>
							<Button
								size="xs"
								color="red"
								variant="light"
								leftSection={<Icon path={iconDelete} />}
								onClick={handleDelete}
							>
								Delete instance
							</Button>
						</Group>
					)}
				</Stack>
			</Paper>
		</Section>
	);
}
