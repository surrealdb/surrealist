import { Modal, Group, Button, Alert, Text, Menu, Divider, Stack } from "@mantine/core";
import { useImmer } from "use-immer";
import { isConnectionValid } from "~/util/connection";
import { useStable } from "~/hooks/stable";
import { Fragment, useLayoutEffect, useMemo } from "react";
import { useConnections } from "~/hooks/connection";
import { Connection, Template } from "~/types";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { createBaseConnection } from "~/util/defaults";
import { iconCheck, iconChevronDown, iconDelete, iconFile, iconPlay, iconPlus } from "~/util/icons";
import { useSetting } from "~/hooks/config";
import { useIntent } from "~/hooks/url";
import { useDatabaseStore } from "~/stores/database";
import { useConfirmation } from "~/providers/Confirmation";
import { ConnectionDetails } from "~/components/ConnectionDetails";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";

function buildName(n: number) {
	return `New connection ${n ? n + 1 : ""}`.trim();
}

function newConnection() {
	const { settings } = useConfigStore.getState();

	return createBaseConnection(settings);
}

export function ConnectionModal() {
	const connections = useConnections();

	const { addConnection, updateConnection, setActiveConnection, removeConnection } = useConfigStore.getState();
	const { closeConnectionEditor, openConnectionCreator } = useInterfaceStore.getState();
	const { isServing } = useDatabaseStore.getState();

	const opened = useInterfaceStore((s) => s.showConnectionEditor);
	const editingId = useInterfaceStore((s) => s.editingConnectionId);
	const isCreating = useInterfaceStore((s) => s.isCreatingConnection);

	const [templates] = useSetting("templates", "list");
	const [details, setDetails] = useImmer<Connection>(newConnection());
	const isValid = useMemo(() => {
		return details.name && isConnectionValid(details.authentication);
	}, [details.authentication, details.name]);

	const saveInfo = useStable(async () => {
		closeConnectionEditor();

		if (isCreating) {
			addConnection(details);
			setActiveConnection(details.id);
		} else {
			updateConnection({
				id: editingId,
				name: details.name,
				icon: details.icon,
				authentication: details.authentication,
				group: details.group,
			});
		}
	});

	const generateName = useStable(() => {
		let tabName = "";
		let counter = 0;

		do {
			tabName = buildName(counter);
			counter++;
		} while (connections.some((con) => con.name === tabName));

		return tabName;
	});

	const applyTemplate = useStable((template: Template) => {
		setDetails(draft => {
			draft.icon = template.icon;
			draft.group = template.group;
			draft.authentication = template.values;
		});
	});

	const templateList = useMemo(() => {
		const list = templates.map(info => ({
			info,
			icon: iconFile
		}));

		if (isServing) {
			const { username, password, port } = useConfigStore.getState().settings.serving;

			list.push({
				icon: iconPlay,
				info: {
					id: "serving",
					name: "Local database",
					icon: 0,
					values: {
						mode: "root",
						database: "",
						namespace: "",
						protocol: "ws",
						hostname: `localhost:${port}`,
						scope: "",
						scopeFields: [],
						token: "",
						username,
						password
					}
				}
			});
		}

		return list;
	}, [templates, isServing]);

	useLayoutEffect(() => {
		if (!details.name.trim()) {
			setDetails((draft) => {
				draft.name = generateName();
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [details.name]);

	useLayoutEffect(() => {
		if (opened) {
			const base = newConnection();

			if (isCreating) {
				setDetails({
					...base,
					name: generateName(),
				});
			} else {
				const info = connections.find((con) => con.id === editingId);

				setDetails(info || base);
			}
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [opened]);

	const remove = useConfirmation({
		title: "Remove connection",
		message: "Are you sure you want to remove this connection?",
		onConfirm() {
			removeConnection(details.id);
			closeConnectionEditor();
		}
	});

	useIntent("new-connection", () => {
		openConnectionCreator();
	});

	return (
		<Modal
			opened={opened}
			onClose={closeConnectionEditor}
			trapFocus={false}
			size={520}
		>
			<Form onSubmit={saveInfo}>
				{templateList.length > 0 && (
					<Alert mb="xl" p="xs">
						<Group>
							<Icon
								ml={6}
								path={iconFile}
								color="surreal.1"
								size={1.2}
							/>
							<Text>
								Apply a connection template?
							</Text>
							<Spacer />
							<Menu
								position="bottom-start"
								transitionProps={{
									transition: "scale-y"
								}}
							>
								<Menu.Target>
									<Button
										color="slate"
										variant="light"
										rightSection={<Icon path={iconChevronDown} />}
									>
										Apply template
									</Button>
								</Menu.Target>
								<Menu.Dropdown>
									<Stack gap={4}>
										{templateList.map(({ info }, i) => (
											<Fragment key={info.id}>
												<Menu.Item
													onClick={() => applyTemplate(info)}
													miw={175}
												>
													{info.name}
												</Menu.Item>
												{i < templateList.length - 1 && <Divider color="slate" />}
											</Fragment>
										))}
									</Stack>
								</Menu.Dropdown>
							</Menu>
						</Group>
					</Alert>
				)}

				<ConnectionDetails
					value={details}
					onChange={setDetails}
				/>

				<Group mt="xl">
					<Button
						color="slate"
						variant="light"
						onClick={closeConnectionEditor}
					>
						Close
					</Button>
					<Spacer />
					{!isCreating && (
						<Button
							color="pink.7"
							variant="light"
							onClick={remove}
							leftSection={<Icon path={iconDelete} />}
						>
							Remove
						</Button>
					)}
					<Button
						type="submit"
						variant="gradient"
						disabled={!isValid}
						rightSection={<Icon path={isCreating ? iconPlus : iconCheck} />}
					>
						{isCreating ? "Create" : "Save"}
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
