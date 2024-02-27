import { Modal, Group, Button } from "@mantine/core";
import { Spacer } from "../Spacer";
import { useImmer } from "use-immer";
import { isConnectionValid } from "~/util/connection";
import { useStable } from "~/hooks/stable";
import { Form } from "../Form";
import { useLayoutEffect } from "react";
import { updateTitle } from "~/util/helpers";
import { useConnections } from "~/hooks/connection";
import { Connection } from "~/types";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { createBaseConnection } from "~/util/defaults";
import { Icon } from "../Icon";
import { iconCheck, iconDelete, iconPlus } from "~/util/icons";
import { ConnectionDetails } from "../ConnectionDetails";

function buildName(n: number) {
	return `New connection ${n ? n + 1 : ""}`.trim();
}

export function ConnectionEditor() {
	const connections = useConnections();

	const { addConnection, updateConnection, setActiveConnection, removeConnection } = useConfigStore.getState();
	const { closeConnectionEditor } = useInterfaceStore.getState();

	const opened = useInterfaceStore((s) => s.showConnectionEditor);
	const editingId = useInterfaceStore((s) => s.editingConnectionId);
	const isCreating = useInterfaceStore((s) => s.isCreatingConnection);

	const [details, setDetails] = useImmer<Connection>(createBaseConnection());
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

	useLayoutEffect(() => {
		if (!details.name.trim()) {
			setDetails((draft) => {
				draft.name = generateName();
			});
		}
	}, [details.name]);

	useLayoutEffect(() => {
		if (opened) {
			const base = createBaseConnection();

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

	return (
		<Modal
			opened={opened}
			onClose={closeConnectionEditor}
			trapFocus={false}
			size="lg"
		>
			<Form onSubmit={saveInfo}>
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
