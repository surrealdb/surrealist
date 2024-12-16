import { Alert, Button, Divider, Group, Menu, Modal, Stack, Text } from "@mantine/core";

import { iconCheck, iconChevronDown, iconFile, iconPlus } from "~/util/icons";

import { useDisclosure } from "@mantine/hooks";
import { Fragment, useLayoutEffect, useMemo, useState } from "react";
import { useImmer } from "use-immer";
import { ConnectionDetails } from "~/components/ConnectionDetails";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useSetting } from "~/hooks/config";
import { useConnectionList } from "~/hooks/connection";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfigStore } from "~/stores/config";
import type { Connection, Template } from "~/types";
import { isConnectionValid } from "~/util/connection";
import { createBaseConnection } from "~/util/defaults";
import { uniqueName } from "~/util/helpers";

function newConnection() {
	const { settings } = useConfigStore.getState();

	return createBaseConnection(settings);
}

export function ConnectionModal() {
	const connections = useConnectionList();
	const { addConnection, updateConnection, setActiveConnection } = useConfigStore.getState();

	const [opened, openedHandle] = useDisclosure();
	const [editingId, setEditingId] = useState("");
	const [isCreating, setIsCreating] = useState(false);
	const [select, setSelect] = useState(false);

	const [templates] = useSetting("templates", "list");
	const [details, setDetails] = useImmer<Connection>(newConnection());

	const isValid = useMemo(() => {
		return details.name && isConnectionValid(details.authentication);
	}, [details.authentication, details.name]);

	const saveInfo = useStable(async () => {
		openedHandle.close();

		if (isCreating) {
			addConnection(details);
		} else {
			updateConnection({
				id: editingId,
				name: details.name,
				icon: details.icon,
				authentication: details.authentication,
				group: details.group,
			});
		}

		if (select) {
			setActiveConnection(details.id);
		}
	});

	const applyTemplate = useStable((template: Template) => {
		setDetails((draft) => {
			draft.name = template.name;
			draft.icon = template.icon;
			draft.group = template.group;
			draft.authentication = template.values;
		});
	});

	useLayoutEffect(() => {
		if (!details.name.trim()) {
			setDetails((draft) => {
				const existing = connections.map((con) => con.name);
				const tabName = uniqueName("New connection", existing);

				draft.name = tabName;
			});
		}
	}, [details.name, connections]);

	useIntent("new-connection", ({ template }) => {
		setIsCreating(true);
		setEditingId("");
		setDetails(newConnection());
		setSelect(true);
		openedHandle.open();

		if (template) {
			applyTemplate(JSON.parse(template) as Template);
		}
	});

	useIntent("edit-connection", ({ id, select }) => {
		const base = newConnection();
		const info = connections.find((con) => con.id === id);

		setIsCreating(false);
		setEditingId(id);
		setDetails(info || base);
		setSelect(!!select && select !== "false");
		openedHandle.open();
	});

	return (
		<Modal
			opened={opened}
			onClose={openedHandle.close}
			trapFocus={false}
			size={520}
		>
			<Form onSubmit={saveInfo}>
				{templates.length > 0 && (
					<Alert
						mb="xl"
						p="xs"
					>
						<Group>
							<Icon
								ml={6}
								path={iconFile}
								color="surreal.1"
								size={1.2}
							/>
							<Text>Apply a connection template?</Text>
							<Spacer />
							<Menu
								position="bottom-start"
								transitionProps={{
									transition: "scale-y",
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
										{templates.map((info, i) => (
											<Fragment key={info.id}>
												<Menu.Item
													onClick={() => applyTemplate(info)}
													miw={175}
												>
													{info.name}
												</Menu.Item>
												{i < templates.length - 1 && <Divider />}
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
						onClick={openedHandle.close}
					>
						Close
					</Button>
					<Spacer />
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
