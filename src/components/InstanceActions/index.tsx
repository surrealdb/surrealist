import { Menu } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { PropsWithChildren, useMemo } from "react";
import { Link } from "wouter";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudAuthTokenMutation } from "~/cloud/mutations/auth";
import { useDeleteInstance, usePauseInstance, useResumeInstance } from "~/hooks/cloud";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { CloudInstance, CloudOrganization } from "~/types";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { iconBug, iconDelete, iconEdit, iconOrganization, iconPause, iconPlay } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { openResourcesLockedModal } from "../App/modals/resources-locked";

export interface InstanceActionsProps {
	instance: CloudInstance;
	organisation: CloudOrganization;
}

export function InstanceActions({
	instance,
	organisation,
	children,
}: PropsWithChildren<InstanceActionsProps>) {
	const authTokenMutation = useCloudAuthTokenMutation(instance.id);
	const connections = useConnectionList();

	const canModify = hasOrganizationRoles(organisation, ORG_ROLES_ADMIN);

	const connection = useMemo(() => {
		return connections.find((c) => c.authentication.cloudInstance === instance.id);
	}, [connections, instance.id]);

	const pauseInstance = usePauseInstance(instance);
	const resumeInstance = useResumeInstance(instance);
	const deleteInstance = useDeleteInstance(instance, connection);

	const handleEdit = useStable(() => {
		if (!connection) return;

		openConnectionEditModal(connection);
	});

	const handleCopyHost = useStable(() => {
		navigator.clipboard.writeText(instance.host).then(() => {
			showInfo({
				title: "Copied",
				subtitle: "Successfully copied hostname to clipboard",
			});
		});
	});

	const handleCopyID = useStable(() => {
		navigator.clipboard.writeText(instance.id).then(() => {
			showInfo({
				title: "Copied",
				subtitle: "Successfully copied instance id to clipboard",
			});
		});
	});

	const handleCopyAuthToken = async () => {
		const token = await authTokenMutation.mutateAsync();

		if (!token) {
			return showErrorNotification({
				title: "Failed to copy auth token",
				content: "Auth token is not available",
			});
		}

		try {
			await navigator.clipboard.writeText(token);
			showInfo({
				title: "Copied",
				subtitle: "Successfully copied auth token to clipboard",
			});
		} catch (_error) {
			showErrorNotification({
				title: "Failed to copy auth token",
				content: "Unable to copy auth token to clipboard",
			});
		}
	};

	const isReady = instance.state === "ready";
	const isPaused = instance.state === "paused";

	return (
		<Menu
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>{children}</Menu.Target>
			<Menu.Dropdown>
				<Menu.Item
					leftSection={<Icon path={iconEdit} />}
					onClick={handleEdit}
					disabled={!connection}
				>
					Edit connection
				</Menu.Item>
				<Link href={`/o/${instance.organization_id}`}>
					<Menu.Item leftSection={<Icon path={iconOrganization} />}>
						View organisation
					</Menu.Item>
				</Link>
				<Menu.Item
					leftSection={<Icon path={iconBug} />}
					onClick={() => {
						dispatchIntent("create-message", {
							type: "conversation",
							organisation: organisation.id,
							message: `Hello! I would like to report an issue regarding my instance (ID: ${instance.id})`,
							conversationType: "instance-issue",
						});
					}}
				>
					Report an issue
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item onClick={handleCopyHost}>Copy hostname</Menu.Item>
				<Menu.Item onClick={handleCopyID}>Copy instance ID</Menu.Item>
				<Menu.Item
					onClick={handleCopyAuthToken}
					disabled={instance.state !== "ready"}
				>
					Copy Auth token
				</Menu.Item>
				{canModify && (isReady || isPaused) && (
					<>
						<Menu.Divider />
						{isReady ? (
							<>
								<Menu.Item
									leftSection={<Icon path={iconPause} />}
									onClick={() => {
										if (organisation.resources_locked) {
											openResourcesLockedModal(organisation);
										} else {
											pauseInstance();
										}
									}}
								>
									Pause instance
								</Menu.Item>
								<Menu.Item
									leftSection={
										<Icon
											path={iconDelete}
											c="red"
										/>
									}
									onClick={() => {
										if (organisation.resources_locked) {
											openResourcesLockedModal(organisation);
										} else {
											deleteInstance();
										}
									}}
									c="red"
								>
									Delete instance
								</Menu.Item>
							</>
						) : (
							isPaused && (
								<Menu.Item
									leftSection={<Icon path={iconPlay} />}
									onClick={() => {
										if (organisation.resources_locked) {
											openResourcesLockedModal(organisation);
										} else {
											resumeInstance();
										}
									}}
								>
									Resume instance
								</Menu.Item>
							)
						)}
					</>
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
