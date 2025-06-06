import { Alert, Menu, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { fetchAPI } from "~/cloud/api";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { useCloudAuthTokenMutation } from "~/cloud/mutations/auth";
import { useDeleteInstance, usePauseInstance, useResumeInstance } from "~/hooks/cloud";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import { CloudInstance } from "~/types";
import { tagEvent } from "~/util/analytics";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { iconDelete, iconEdit, iconOrganization, iconPause, iconPlay } from "~/util/icons";
import { Icon } from "../Icon";

export interface InstanceActionsProps {
	instance: CloudInstance;
}

export function InstanceActions({ instance, children }: PropsWithChildren<InstanceActionsProps>) {
	const authTokenMutation = useCloudAuthTokenMutation(instance.id);
	const connections = useConnectionList();

	const canModify = useHasOrganizationRole(instance?.organization_id ?? "", "owner");

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
		} catch (error) {
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
									onClick={pauseInstance}
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
									onClick={deleteInstance}
									c="red"
								>
									Delete instance
								</Menu.Item>
							</>
						) : (
							isPaused && (
								<Menu.Item
									leftSection={<Icon path={iconPlay} />}
									onClick={resumeInstance}
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
