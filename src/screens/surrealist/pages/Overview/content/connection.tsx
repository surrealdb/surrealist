import classes from "../style.module.scss";

import { ActionIcon, Badge, Menu, Text } from "@mantine/core";
import { Box, BoxProps, Group, Paper, Stack, ThemeIcon, UnstyledButton } from "@mantine/core";
import clsx from "clsx";
import { PropsWithChildren, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { SANDBOX } from "~/constants";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import { Connection, ConnectionListMode } from "~/types";
import { ON_STOP_PROPAGATION, newId } from "~/util/helpers";
import { iconCopy, iconDelete, iconDotsVertical, iconEdit, iconSandbox } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { USER_ICONS } from "~/util/user-icons";

export interface StartConnectionProps extends BoxProps {
	connection: Connection;
	presentation: ConnectionListMode;
	onConnect: (connection: Connection) => void;
}

export function StartConnection({
	connection,
	presentation,
	onConnect,
	children,
	...other
}: PropsWithChildren<StartConnectionProps>) {
	const { addConnection, removeConnection } = useConfigStore.getState();
	const { protocol, hostname } = connection.authentication;

	const containerRef = useRef<HTMLDivElement>(null);
	const isSandbox = connection.id === SANDBOX;
	const target = protocol === "mem" ? "In-Memory" : protocol === "indxdb" ? "IndexDB" : hostname;

	const handleConnect = useStable(() => {
		onConnect(connection);
	});

	const handleEdit = useStable(() => {
		dispatchIntent("edit-connection", {
			id: connection.id,
		});
	});

	const handleDuplicate = useStable(() => {
		addConnection({
			...connection,
			lastNamespace: "",
			lastDatabase: "",
			id: newId(),
		});
	});

	const handleDelete = useConfirmation({
		title: "Remove connection",
		message: "Are you sure you want to remove this connection?",
		skippable: true,
		onConfirm() {
			removeConnection(connection.id);
		},
	});

	const labels = connection?.labels?.map((label, i) => (
		<Badge
			key={i}
			color="slate"
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
				className={clsx(
					classes.startBox,
					classes.startConnection,
					presentation === "row" && classes.startRow,
				)}
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
									{target}
								</Text>
							</Box>
						</Group>
					</Stack>
					{presentation === "row" && <Group gap="xs">{labels}</Group>}
					{!isSandbox && (
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
										Edit details
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
				{presentation === "card" && <Group gap="xs">{labels}</Group>}
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
