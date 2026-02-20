import {
	ActionIcon,
	Anchor,
	Badge,
	BoxProps,
	Group,
	Menu,
	Paper,
	Stack,
	Text,
	ThemeIcon,
	UnstyledButton,
} from "@mantine/core";
import {
	Icon,
	iconCopy,
	iconDelete,
	iconDotsVertical,
	iconEdit,
	iconSurreal,
	Spacer,
} from "@surrealdb/ui";
import { PropsWithChildren, useRef } from "react";
import { SANDBOX } from "~/constants";
import { useStable } from "~/hooks/stable";
import { openConnectionEditModal } from "~/modals/edit-connection";
import { useConfirmation } from "~/providers/Confirmation";
import { useConfigStore } from "~/stores/config";
import { Connection } from "~/types";
import { tagEvent } from "~/util/analytics";
import { getConnectionVariant } from "~/util/connection";
import { newId, ON_STOP_PROPAGATION } from "~/util/helpers";
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
			variant: getConnectionVariant(connection),
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
				variant: getConnectionVariant(connection),
				is_local: connection.authentication.hostname.includes("localhost"),
			});
		},
	});

	const labels = connection?.labels?.map((label, i) => (
		<Badge
			key={i}
			size="sm"
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
			<Anchor
				variant="glow"
				c="var(--mantine-color-text)"
			>
				<Paper
					p="lg"
					ref={containerRef}
				>
					<Group
						wrap="nowrap"
						align="strech"
						flex={1}
						mt={-3}
					>
						<Group wrap="nowrap">
							<ThemeIcon
								size="xl"
								variant="light"
							>
								<Icon
									size={isSandbox ? "lg" : "md"}
									path={isSandbox ? iconSurreal : USER_ICONS[connection.icon]}
								/>
							</ThemeIcon>
							<Stack gap={0}>
								<Group gap="sm">
									<Text
										c="bright"
										fw={600}
										fz="xl"
										truncate
									>
										{connection.name}
									</Text>

									{isManaged ? (
										<Text
											fw={600}
											fz="xs"
											variant="gradient"
										>
											BUILT-IN
										</Text>
									) : (
										<Group gap="xs">{labels}</Group>
									)}
								</Group>
								<Text truncate>
									{isSandbox ? "Your personal offline playground" : target}
								</Text>
							</Stack>
						</Group>
						{!isManaged && (
							<>
								<Spacer />
								{/** biome-ignore lint/a11y/noStaticElementInteractions: It's fine */}
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
							</>
						)}
					</Group>
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}
