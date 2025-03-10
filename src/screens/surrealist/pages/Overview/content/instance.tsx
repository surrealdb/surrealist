import classes from "../style.module.scss";

import {
	ActionIcon,
	Alert,
	Box,
	BoxProps,
	Group,
	Menu,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { PropsWithChildren, useMemo, useRef } from "react";
import { fetchAPI } from "~/cloud/api";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { CloudInstance, ConnectionListMode } from "~/types";
import { ON_STOP_PROPAGATION, showError, showInfo } from "~/util/helpers";
import {
	iconCloud,
	iconDelete,
	iconDotsVertical,
	iconEdit,
	iconPause,
	iconPlay,
} from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { USER_ICONS } from "~/util/user-icons";
import { StateBadge } from "../badge";

export interface StartInstanceProps extends BoxProps {
	instance: CloudInstance;
	presentation: ConnectionListMode;
	onConnect: (instance: CloudInstance) => void;
}

export function StartInstance({
	instance,
	presentation,
	onConnect,
	children,
	...other
}: PropsWithChildren<StartInstanceProps>) {
	const containerRef = useRef<HTMLDivElement>(null);
	const connections = useConnectionList();
	const client = useQueryClient();

	const connection = useMemo(() => {
		return connections.find((c) => c.authentication.cloudInstance === instance.id);
	}, [connections, instance.id]);

	const handleConnect = useStable(() => {
		onConnect(instance);
	});

	const handleEdit = useStable(() => {
		if (!connection) return;

		dispatchIntent("edit-connection", {
			id: connection.id,
		});
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

				client.setQueryData(["cloud", "instances"], (data: CloudInstance[]) => {
					return data.filter((i) => i.id !== instance.id);
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
		<UnstyledButton
			onClick={handleConnect}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(
					classes.startBox,
					classes.startInstance,
					presentation === "row" && classes.startRow,
				)}
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					align="strech"
					h="100%"
				>
					<Stack flex={1}>
						<Group
							wrap="nowrap"
							mt={-3}
						>
							<ThemeIcon
								radius="xs"
								size={36}
								color="slate"
								variant="light"
							>
								<Icon path={connection ? USER_ICONS[connection.icon] : iconCloud} />
							</ThemeIcon>
							<Box flex={1}>
								<Group>
									<Text
										c="bright"
										fw={600}
										fz="xl"
									>
										{connection?.name ?? instance.name}
									</Text>
									<StateBadge state={instance.state} />
								</Group>
								<Text>ID: {instance.id}</Text>
							</Box>
						</Group>
					</Stack>
					<div
						onClick={ON_STOP_PROPAGATION}
						onKeyDown={ON_STOP_PROPAGATION}
					>
						<Menu
							transitionProps={{
								transition: "scale-y",
							}}
						>
							<Menu.Target>
								<ActionIcon
									color="slate"
									variant="subtle"
									component="div"
									disabled={
										instance.state !== "ready" && instance.state !== "paused"
									}
								>
									<Icon path={iconDotsVertical} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									leftSection={<Icon path={iconEdit} />}
									onClick={handleEdit}
								>
									Edit details
								</Menu.Item>
								<Menu.Divider />
								<Menu.Item onClick={handleCopyHost}>Copy hostname</Menu.Item>
								<Menu.Item onClick={handleCopyID}>Copy instance ID</Menu.Item>
								<Menu.Divider />
								{instance.state === "ready" ? (
									<Menu.Item
										leftSection={<Icon path={iconPause} />}
										onClick={handlePause}
									>
										Pause instance
									</Menu.Item>
								) : (
									instance.state === "paused" && (
										<Menu.Item
											leftSection={<Icon path={iconPlay} />}
											onClick={handleResume}
										>
											Resume instance
										</Menu.Item>
									)
								)}
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
							</Menu.Dropdown>
						</Menu>
					</div>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
