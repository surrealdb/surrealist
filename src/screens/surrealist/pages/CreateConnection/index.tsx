import classes from "./style.module.scss";

import { Box, Button, Group, Menu, ScrollArea, Stack, Text, ThemeIcon } from "@mantine/core";
import { useMemo } from "react";
import { useImmer } from "use-immer";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { ConnectionAddressDetails } from "~/components/ConnectionDetails/address";
import { ConnectionAuthDetails } from "~/components/ConnectionDetails/authentication";
import { ConnectionNameDetails } from "~/components/ConnectionDetails/connection";
import { ConnectionLabelsDetails } from "~/components/ConnectionDetails/labels";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useLastSavepoint } from "~/hooks/overview";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { Template } from "~/types";
import { tagEvent } from "~/util/analytics";
import { isConnectionValid } from "~/util/connection";
import { createBaseConnection } from "~/util/defaults";
import { iconArrowLeft, iconChevronDown, iconChevronRight, iconHomePlus } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { USER_ICONS } from "~/util/user-icons";

export function CreateConnectionPage() {
	const { settings, addConnection } = useConfigStore.getState();

	const [connection, setConnection] = useImmer(createBaseConnection(settings));
	const navigateConnection = useConnectionNavigator();

	const isValid = useMemo(() => {
		return connection.name && isConnectionValid(connection.authentication);
	}, [connection.authentication, connection.name]);

	const handleCreate = useStable(() => {
		addConnection(connection);
		navigateConnection(connection.id);

		tagEvent("connection_created", {
			protocol: connection.authentication.protocol.toString(),
			is_local: connection.authentication.hostname.includes("localhost"),
		});
	});

	const applyTemplate = (template: Template) => {
		setConnection((draft) => {
			draft.name = template.name;
			draft.icon = template.icon;
			draft.labels = template.labels;
			draft.authentication = template.values;
		});
	};

	const openTemplates = useStable(() => {
		dispatchIntent("open-settings", { tab: "templates" });
	});

	// const newLocalhost = useStable(() => {
	// 	const { username, password, port } = useConfigStore.getState().settings.serving;

	// 	const template = JSON.stringify({
	// 		name: "Local database",
	// 		icon: 0,
	// 		values: {
	// 			mode: "root",
	// 			database: "",
	// 			namespace: "",
	// 			protocol: "ws",
	// 			hostname: `localhost:${port}`,
	// 			scope: "",
	// 			scopeFields: [],
	// 			access: "",
	// 			token: "",
	// 			username,
	// 			password,
	// 		},
	// 	});

	// 	dispatchIntent("new-connection", { template });
	// 	openedHandle.close();
	// });

	const localhost = useMemo(() => {
		const { username, password, port } = useConfigStore.getState().settings.serving;

		return {
			id: "_localhost",
			name: "Local database",
			icon: 0,
			values: {
				mode: "root",
				database: "",
				namespace: "",
				protocol: "ws",
				hostname: `localhost:${port}`,
				accessFields: [],
				access: "",
				token: "",
				username,
				password,
			},
		} as Template;
	}, []);

	const templates = useConfigStore((s) => s.settings.templates.list);
	const savepoint = useLastSavepoint();

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				<Stack
					mx="auto"
					maw={650}
					gap="lg"
				>
					<Box>
						<PrimaryTitle fz={26}>New connection</PrimaryTitle>
						<Text fz="xl">Connect to any SurrealDB instance</Text>
					</Box>

					<Group>
						<Link to={savepoint.path}>
							<Button
								variant="light"
								color="slate"
								size="xs"
								leftSection={<Icon path={iconArrowLeft} />}
							>
								Back to {savepoint.name}
							</Button>
						</Link>
						<Spacer />
						<Menu position="bottom-end">
							<Menu.Target>
								<Button
									rightSection={<Icon path={iconChevronDown} />}
									color="slate"
									variant="light"
									size="xs"
								>
									Apply template
								</Button>
							</Menu.Target>
							<Menu.Dropdown miw={200}>
								{adapter.isServeSupported && (
									<>
										<Menu.Item
											onClick={() => applyTemplate(localhost)}
											leftSection={
												<ThemeIcon
													color="slate"
													variant="light"
													radius="xs"
													mr="xs"
												>
													<Icon path={iconHomePlus} />
												</ThemeIcon>
											}
										>
											<Box>
												<Text
													c="bright"
													fw={500}
													lh={1}
												>
													Localhost
												</Text>
												<Text fz="sm">Automatic template</Text>
											</Box>
										</Menu.Item>
										<Menu.Divider />
									</>
								)}
								{templates.length > 0 && (
									<>
										{templates.map((template) => (
											<Menu.Item
												key={template.id}
												onClick={() => applyTemplate(template)}
												leftSection={
													<ThemeIcon
														color="slate"
														variant="light"
														radius="xs"
														mr="xs"
													>
														<Icon path={USER_ICONS[template.icon]} />
													</ThemeIcon>
												}
											>
												<Text
													c="bright"
													fw={500}
												>
													{template.name}
												</Text>
											</Menu.Item>
										))}
										<Menu.Divider />
									</>
								)}
								<Menu.Item
									rightSection={<Icon path={iconChevronRight} />}
									onClick={openTemplates}
								>
									Manage templates
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
					</Group>

					<Box mt={24}>
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Connection
						</Text>
						<Text>Specify an icon and name for this connection</Text>
					</Box>

					<ConnectionNameDetails
						value={connection}
						onChange={setConnection}
					/>

					<Box mt={32}>
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Remote address
						</Text>
						<Text>Select a communication protocol and specify instance address</Text>
					</Box>

					<ConnectionAddressDetails
						value={connection}
						onChange={setConnection}
					/>

					<Box mt={24}>
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Authentication
						</Text>
						<Text>Specify how you want to access your instance</Text>
					</Box>

					<ConnectionAuthDetails
						value={connection}
						onChange={setConnection}
					/>

					<Box mt={24}>
						<Text
							fz="xl"
							fw={600}
							c="bright"
						>
							Labels
						</Text>
						<Text>Add filtering labels to this connection</Text>
					</Box>

					<ConnectionLabelsDetails
						value={connection}
						onChange={setConnection}
					/>

					<Group mt={24}>
						<Link to={savepoint.path}>
							<Button
								color="slate"
								variant="light"
							>
								Cancel
							</Button>
						</Link>
						<Spacer />
						<Button
							w={150}
							type="submit"
							variant="gradient"
							disabled={!isValid}
							onClick={handleCreate}
						>
							Create connection
						</Button>
					</Group>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
