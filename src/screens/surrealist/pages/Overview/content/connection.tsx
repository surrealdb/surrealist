import classes from "../style.module.scss";

import { ActionIcon, Badge, Menu, Text } from "@mantine/core";
import { Box, BoxProps, Group, Paper, Stack, ThemeIcon, UnstyledButton } from "@mantine/core";
import clsx from "clsx";
import { PropsWithChildren, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { SANDBOX } from "~/constants";
import { useStable } from "~/hooks/stable";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import { Connection } from "~/types";
import { tagEvent } from "~/util/analytics";
import { ON_STOP_PROPAGATION, newId } from "~/util/helpers";
import { iconCopy, iconDelete, iconDotsVertical, iconEdit, iconSandbox } from "~/util/icons";
import { USER_ICONS } from "~/util/user-icons";

export interface StartConnectionProps extends BoxProps {
	connection: Connection;
	onConnect: (connection: Connection) => void;
}

export function StartConnection({
	connection,
	onConnect,
	children,
	...other
}: PropsWithChildren<StartConnectionProps>) {
	const { addConnection, removeConnection } = useConfigStore.getState();
	const { protocol, hostname } = connection.authentication;

	const containerRef = useRef<HTMLDivElement>(null);
	const isSandbox = connection.id === SANDBOX;
	const isManaged = isSandbox || connection.instance;
	const target = protocol === "mem" ? "In-Memory" : protocol === "indxdb" ? "IndexDB" : hostname;

	const handleConnect = useStable(() => {
		onConnect(connection);
	});

	const handleEdit = useStable(() => {
		openConnectionEditModal(connection);
	});

	const handleDuplicate = useStable(() => {
		addConnection({
			...connection,
			lastNamespace: "",
			lastDatabase: "",
			id: newId(),
		});

		tagEvent("connection_duplicated", {
			protocol: connection.authentication.protocol.toString(),
			is_local: connection.authentication.hostname.includes("localhost"),
		});
	});

	const handleDelete = useConfirmation({
		title: "Remove connection",
		message: "Are you sure you want to remove this connection?",
		skippable: true,
		onConfirm() {
			removeConnection(connection.id);

			tagEvent("connection_deleted", {
				protocol: connection.authentication.protocol.toString(),
				is_local: connection.authentication.hostname.includes("localhost"),
			});
		},
	});

	const labels = connection?.labels?.map((label, i) => (
		<Badge
			key={i}
			color="violet"
			variant="light"
		>
			{label}
		</Badge>
	));

	return (
		<UnstyledButton
			onClick={handleConnect}
			{...other}
		>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startConnection)}
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					align="strech"
					flex={1}
				>
					<Stack
						flex={1}
						miw={0}
					>
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
								<Icon
									path={isSandbox ? iconSandbox : USER_ICONS[connection.icon]}
								/>
							</ThemeIcon>
							<Box
								flex={1}
								miw={0}
							>
								<Text
									c="bright"
									fw={600}
									fz="xl"
									truncate
								>
									{connection.name}
								</Text>
								<Text
									mt={-4}
									truncate
								>
									{isSandbox ? "Your personal playground" : target}
								</Text>
							</Box>
						</Group>
					</Stack>
					{!isManaged && (
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
									>
										<Icon path={iconDotsVertical} />
									</ActionIcon>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										leftSection={<Icon path={iconEdit} />}
										onClick={handleEdit}
									>
										Edit connection
									</Menu.Item>
									<Menu.Item
										leftSection={<Icon path={iconCopy} />}
										onClick={handleDuplicate}
									>
										Duplicate
									</Menu.Item>
									<Menu.Divider />
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
										Delete
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</div>
					)}
				</Group>
				{isManaged ? (
					<Badge
						color="violet"
						variant="subtle"
						px={0}
					>
						Built-in
					</Badge>
				) : (
					<Group gap="xs">{labels}</Group>
				)}
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
