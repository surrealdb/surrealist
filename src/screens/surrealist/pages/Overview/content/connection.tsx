import classes from "../style.module.scss";

import { iconSandbox, iconDotsVertical, iconCopy, iconDelete, iconEdit } from "~/util/icons";

import { ActionIcon, Menu, Text } from "@mantine/core";
import { BoxProps, UnstyledButton, Paper, Group, Stack, ThemeIcon, Box } from "@mantine/core";
import clsx from "clsx";
import { PropsWithChildren, useRef } from "react";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { INSTANCE_GROUP, SANDBOX } from "~/constants";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { Connection } from "~/types";
import { USER_ICONS } from "~/util/user-icons";
import { newId, ON_STOP_PROPAGATION } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";

export interface StartConnectionProps extends BoxProps {
	connection: Connection;
	presentation: "card" | "row";
}

export function StartConnection({
	connection,
	presentation,
	children,
	...other
}: PropsWithChildren<StartConnectionProps>) {
	const { addConnection, removeConnection } = useConfigStore.getState();
	const { protocol, hostname } = connection.authentication;

	const containerRef = useRef<HTMLDivElement>(null);
	const navigateConnection = useConnectionNavigator();
	const isInstanceLocal = connection.group === INSTANCE_GROUP;
	const isSandbox = connection.id === SANDBOX;
	const target = protocol === "mem" ? "In-Memory" : protocol === "indxdb" ? "IndexDB" : hostname;

	const handleConnect = useStable(() => {
		navigateConnection(connection.id);
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
			group: isInstanceLocal ? undefined : connection.group,
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
					h="100%"
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
										disabled={isInstanceLocal}
										c="red"
									>
										Delete
									</Menu.Item>
								</Menu.Dropdown>
							</Menu>
						</div>
					)}
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}
