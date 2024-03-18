import { Modal, Group, Button, Alert, Text, Menu } from "@mantine/core";
import { Spacer } from "../../Spacer";
import { useImmer } from "use-immer";
import { Icon } from "../../Icon";
import { isConnectionValid } from "~/util/connection";
import { useStable } from "~/hooks/stable";
import { Form } from "../../Form";
import { useLayoutEffect } from "react";
import { updateTitle } from "~/util/helpers";
import { useConnections } from "~/hooks/connection";
import { Connection, Template } from "~/types";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { createBaseConnection } from "~/util/defaults";
import { iconCheck, iconChevronDown, iconDelete, iconFile, iconPlus } from "~/util/icons";
import { ConnectionDetails } from "../../ConnectionDetails";
import { useSetting } from "~/hooks/config";
import { useEventSubscription } from "~/hooks/event";
import { OpenNewConnectionDialog } from "~/util/global-events";

function buildName(n: number) {
	return `New connection ${n ? n + 1 : ""}`.trim();
}

function newConnection() {
	const { settings } = useConfigStore.getState();

	return createBaseConnection(settings);
}

export function ConnectionEditor() {
	const connections = useConnections();

	const { addConnection, updateConnection, setActiveConnection, removeConnection } = useConfigStore.getState();
	const { closeConnectionEditor, openConnectionCreator } = useInterfaceStore.getState();

	const opened = useInterfaceStore((s) => s.showConnectionEditor);
	const editingId = useInterfaceStore((s) => s.editingConnectionId);
	const isCreating = useInterfaceStore((s) => s.isCreatingConnection);

	const [templates] = useSetting("templates", "list");
	const [details, setDetails] = useImmer<Connection>(newConnection());
	const isValid = details.name && isConnectionValid(details.connection);

	const saveInfo = useStable(async () => {
		closeConnectionEditor();

		if (isCreating) {
			addConnection(details);
			setActiveConnection(details.id);
		} else {
			updateConnection({
				id: editingId,
				name: details.name,
				connection: details.connection,
			});
		}

		updateTitle();
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

	const deleteConnection = useStable(() => {
		removeConnection(details.id);
		closeConnectionEditor();
	});

	const applyTemplate = useStable((template: Template) => {
		setDetails(draft => {
			draft.connection = template.values;
		});
	});

	useLayoutEffect(() => {
		if (!details.name.trim()) {
			setDetails((draft) => {
				draft.name = generateName();
			});
		}
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
	}, [opened]);

	useEventSubscription(OpenNewConnectionDialog, () => {
		openConnectionCreator();
	});

	return (
		<Modal
			opened={opened}
			onClose={closeConnectionEditor}
			trapFocus={false}
			size="lg"
		>
			<Form onSubmit={saveInfo}>
				{isCreating && templates.length > 0 && (
					<Alert mb="sm" p="xs">
						<Group>
							<Icon
								ml={6}
								path={iconFile}
								color="surreal.1"
								size={1.2}
							/>
							<Text>
								Initialize this connection with a template?
							</Text>
							<Spacer />
							<Menu>
								<Menu.Target>
									<Button
										color="slate"
										variant="light"
										rightSection={<Icon path={iconChevronDown} />}
									>
										Select template
									</Button>
								</Menu.Target>

								<Menu.Dropdown>
									{templates.map((template) => (
										<Menu.Item
											key={template.id}
											leftSection={<Icon path={iconFile} />}
											onClick={() => applyTemplate(template)}
											miw={175}
										>
											{template.name}
										</Menu.Item>
									))}
								</Menu.Dropdown>
							</Menu>
						</Group>
					</Alert>
				)}

				<ConnectionDetails
					value={details}
					onChange={setDetails}
				/>

				<Group mt="lg">
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
							color="red"
							onClick={deleteConnection}
							variant="light"
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
