import glowUrl from "~/assets/images/glow.webp";
import cloudUrl from "~/assets/images/icons/cloud.webp";
import classes from "./style.module.scss";

import {
	Box,
	Button,
	Group,
	Image,
	Menu,
	Paper,
	ScrollArea,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core";

import { useMemo } from "react";
import { useImmer } from "use-immer";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { ConnectionAddressDetails } from "~/components/ConnectionDetails/address";
import { ConnectionAuthDetails } from "~/components/ConnectionDetails/authentication";
import { ConnectionNameDetails } from "~/components/ConnectionDetails/connection";
import { ConnectionLabelsDetails } from "~/components/ConnectionDetails/labels";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useLastSavepoint } from "~/hooks/overview";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import { Template } from "~/types";
import { tagEvent } from "~/util/analytics";
import { isConnectionValid } from "~/util/connection";
import { createBaseConnection } from "~/util/defaults";
import { iconChevronDown, iconChevronRight, iconHomePlus } from "~/util/icons";
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
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				mt={18}
			>
				<Stack
					px="xl"
					mx="auto"
					maw={1200}
					pb={68}
				>
					<Box>
						<PageBreadcrumbs
							items={[
								{ label: "Surrealist", href: "/overview" },
								{ label: "Connections" },
								{ label: "Create" },
							]}
						/>
						<Group mt="sm">
							<PrimaryTitle
								fz={32}
								flex={1}
							>
								Create connection
							</PrimaryTitle>
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
															<Icon
																path={USER_ICONS[template.icon]}
															/>
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
					</Box>
					<Paper
						p="xl"
						pos="relative"
						variant="gradient"
						className={classes.cloudBox}
					>
						<Stack flex={1}>
							<Text
								maw={650}
								fz="lg"
							>
								Looking for the most hassle-free SurrealDB experience?{" "}
								<Text
									span
									inherit
									c="bright"
								>
									Surreal Cloud
								</Text>{" "}
								is the easiest way to deploy and manage your database—no
								infrastructure setup or maintenance required.
							</Text>
							<Group mt="md">
								<Link href="/signin/deploy">
									<Button
										size="xs"
										variant="gradient"
										rightSection={<Icon path={iconChevronRight} />}
									>
										Deploy now
									</Button>
								</Link>
								<a href="https://surrealdb.com/cloud">
									<Button
										size="xs"
										color="slate"
										variant="light"
									>
										Learn more
									</Button>
								</a>
							</Group>
						</Stack>
						<Image
							src={cloudUrl}
							className={classes.cloudImage}
						/>
						<Image
							src={glowUrl}
							className={classes.cloudGlow}
						/>
					</Paper>
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
								Back
							</Button>
						</Link>
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
