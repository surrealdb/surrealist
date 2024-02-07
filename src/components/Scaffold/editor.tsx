import { Modal, Group, Button } from "@mantine/core";
import { ConnectionDetails } from "../ConnectionDetails";
import { Spacer } from "../Spacer";
import { useIsLight } from "~/hooks/theme";
import { useImmer } from "use-immer";
import { isConnectionValid } from "~/util/connection";
import { useStable } from "~/hooks/stable";
import { Form } from "../Form";
import { useEffect } from "react";
import { updateTitle } from "~/util/helpers";
import { useConnection, useConnections } from "~/hooks/connection";
import { ConnectionOptions } from "~/types";
import { ModalTitle } from "../ModalTitle";
import { closeConnection, openConnection } from "~/database";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { createBaseConnectionOptions } from "~/util/defaults";

export function ConnectionEditor() {
	const isLight = useIsLight();
	const connections = useConnections();
	const activeConnection = useConnection();

	const { updateConnection } = useConfigStore.getState();
	const { closeConnectionEditor } = useInterfaceStore.getState();

	const autoConnect = useConfigStore((s) => s.autoConnect);
	const opened = useInterfaceStore((s) => s.showConnectionEditor);
	const editingId = useInterfaceStore((s) => s.editingConnectionId);
	const isCreating = useInterfaceStore((s) => s.isCreatingConnection);

	const [details, setDetails] = useImmer<ConnectionOptions>(createBaseConnectionOptions());
	const isValid = isConnectionValid(details);

	const saveInfo = useStable(async () => {
		closeConnectionEditor();

		updateConnection({
			id: editingId,
			connection: details,
		});

		if (activeConnection?.id == editingId) {
			closeConnection();
	
			if (autoConnect && isValid) {
				openConnection();
			}
		}

		updateTitle();
	});

	useEffect(() => {
		if (opened) {
			const base = createBaseConnectionOptions();

			if (isCreating) {
				setDetails(base);
			} else {
				const info = connections.find((tab) => tab.id === editingId);

				setDetails(info?.connection || base);
			}
		}
	}, [opened]);

	return (
		<Modal
			opened={opened}
			onClose={closeConnectionEditor}
			trapFocus={false}
			size="lg"
			title={
				<ModalTitle>
					{isCreating ? "New connection" : "Edit connection"}
				</ModalTitle>
			}
		>
			<Form onSubmit={saveInfo}>
				{/* <TextInput
					label="Connection name"
					value={details.name}
					autoFocus
					mb="md"
					onChange={(e) => {
						setDetails((d) => {
							d.name = e.target.value;
						});
					}}
				/> */}

				<ConnectionDetails
					value={details}
					onChange={setDetails}
				/>

				<Group mt="lg">
					<Button color={isLight ? "light.5" : "light.3"} variant="light" onClick={closeConnectionEditor}>
						Close
					</Button>
					<Spacer />
					<Button type="submit" disabled={!isValid}>
						Save details
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
