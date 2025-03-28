import { Alert, Menu, Stack } from "@mantine/core";
import { Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { PropsWithChildren, useMemo } from "react";
import { fetchAPI } from "~/cloud/api";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { useConfirmation } from "~/providers/Confirmation";
import { CloudInstance } from "~/types";
import { showError, showInfo } from "~/util/helpers";
import { iconDelete, iconEdit, iconPause, iconPlay } from "~/util/icons";
import { Icon } from "../Icon";
import { tagEvent } from "~/util/analytics";

export interface InstanceActionsProps {
	instance: CloudInstance;
}

export function InstanceActions({ instance, children }: PropsWithChildren<InstanceActionsProps>) {
	const connections = useConnectionList();
	const client = useQueryClient();

	const connection = useMemo(() => {
		return connections.find((c) => c.authentication.cloudInstance === instance.id);
	}, [connections, instance.id]);

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

	const handlePause = useConfirmation({
		title: `Pause ${instance.name}`,
		message:
			"You can pause this instance to temporarily stop all resources and save costs, while data contained in this instance will be preserved.",
		confirmText: "Pause",
		confirmProps: {
			variant: "gradient",
		},
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${instance.id}/pause`, {
					method: "POST",
				});

				client.invalidateQueries({
					queryKey: ["cloud", "instances"],
				});

				tagEvent("cloud_instance_paused", {
					region: instance.region,
					version: instance.version,
					compute_type: instance.type.category
				});
			} catch (err: any) {
				showError({
					title: "Failed to pause instance",
					subtitle: err.message,
				});
			}
		},
	});

	const handleResume = useConfirmation({
		title: `Resume ${instance.name}`,
		message: "Resume your instance to restore all resources and allow access to your data",
		confirmText: "Resume",
		confirmProps: {
			variant: "gradient",
		},
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${instance.id}/resume`, {
					method: "POST",
				});

				client.invalidateQueries({
					queryKey: ["cloud", "instances"],
				});

				tagEvent("cloud_instance_resumed", {
					region: instance.region,
					version: instance.version,
					compute_type: instance.type.category
				});
			} catch (err: any) {
				showError({
					title: "Failed to resume instance",
					subtitle: err.message,
				});
			}
		},
	});

	const handleDelete = useConfirmation({
		message: (
			<Stack>
				<Text>
					You are about to delete this instance. This will cause all associated resources
					to be destroyed.
				</Text>
				<Alert
					title="Important"
					color="red"
				>
					Data stored within this instance will be permanently deleted and cannot be
					recovered.
				</Alert>
			</Stack>
		),
		confirmText: "Delete",
		title: `Delete ${instance.name}`,
		verification: instance.name,
		verifyText: "Type the instance name to confirm",
		onConfirm: async () => {
			try {
				await fetchAPI(`/instances/${instance.id}`, {
					method: "DELETE",
				});

				showInfo({
					title: "Deleting instance",
					subtitle: (
						<>
							<Text
								span
								c="bright"
							>
								{instance.name}
							</Text>{" "}
							is being deleted
						</>
					),
				});

				client.invalidateQueries({
					queryKey: ["cloud", "instances"],
				});

				tagEvent("cloud_instance_deleted", {
					region: instance.region,
					version: instance.version,
					compute_type: instance.type.category
				});
			} catch (err: any) {
				showError({
					title: "Failed to delete instance",
					subtitle: err.message,
				});
			}
		},
	});

	return (
		<Menu
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>{children}</Menu.Target>
			<Menu.Dropdown>
				{connection && (
					<>
						<Menu.Item
							leftSection={<Icon path={iconEdit} />}
							onClick={handleEdit}
						>
							Edit connection
						</Menu.Item>
						<Menu.Divider />
					</>
				)}
				<Menu.Item onClick={handleCopyHost}>Copy hostname</Menu.Item>
				<Menu.Item onClick={handleCopyID}>Copy instance ID</Menu.Item>
				{instance.state === "ready" ? (
					<>
						<Menu.Divider />
						<Menu.Item
							leftSection={<Icon path={iconPause} />}
							onClick={handlePause}
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
							onClick={handleDelete}
							c="red"
						>
							Delete instance
						</Menu.Item>
					</>
				) : (
					instance.state === "paused" && (
						<>
							<Menu.Divider />
							<Menu.Item
								leftSection={<Icon path={iconPlay} />}
								onClick={handleResume}
							>
								Resume instance
							</Menu.Item>
						</>
					)
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
