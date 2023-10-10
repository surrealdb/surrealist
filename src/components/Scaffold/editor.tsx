import { Modal, Group, Button } from "@mantine/core";
import { ConnectionDetails } from "../ConnectionDetails";
import { Spacer } from "../Spacer";
import { useIsLight } from "~/hooks/theme";
import { useImmer } from "use-immer";
import { createEmptyConnection, isConnectionValid, mergeConnections } from "~/util/environments";
import { useStable } from "~/hooks/stable";
import { store, useStoreValue } from "~/store";
import { Form } from "../Form";
import { useEffect } from "react";
import { updateTitle } from "~/util/helpers";
import { useEnvironmentList, useTabsList } from "~/hooks/environment";
import { InheritAlert } from "../InheritAlert/interface";
import { ConnectionOptions } from "~/types";
import { ModalTitle } from "../ModalTitle";
import { closeConnection, openConnection } from "~/database";
import { updateSession } from "~/stores/config";
import { closeTabEditor } from "~/stores/interface";

export function TabEditor() {
	const isLight = useIsLight();
	const tabs = useTabsList();
	const environments = useEnvironmentList();
	const activeSessionId = useStoreValue((state) => state.config.activeTab);
	const opened = useStoreValue((state) => state.interface.showTabEditor);
	const editingId = useStoreValue((state) => state.interface.editingId);

	const [infoDetails, setInfoDetails] = useImmer<ConnectionOptions>(createEmptyConnection());

	const sessionInfo = tabs.find((tab) => tab.id === editingId);
	const envInfo = environments.find((env) => env.id === sessionInfo?.environment);
	const mergedDetails = mergeConnections(infoDetails, envInfo?.connection || {});

	const detailsValid = isConnectionValid(infoDetails);
	const mergedValid = isConnectionValid(mergedDetails);

	const handleCose = useStable(() => {
		store.dispatch(closeTabEditor());
	});

	const saveInfo = useStable(async () => {
		handleCose();

		store.dispatch(updateSession({
			id: editingId,
			connection: infoDetails,
		}));

		if (activeSessionId == editingId) {
			const { autoConnect } = store.getState().config;

			closeConnection();
	
			if (autoConnect && mergedValid) {
				openConnection();
			}
		}

		updateTitle();
	});

	useEffect(() => {
		if (opened) {
			const tab = tabs.find((tab) => tab.id === editingId);

			setInfoDetails(tab?.connection || createEmptyConnection());
		}
	}, [opened]);

	return (
		<Modal
			opened={opened}
			onClose={handleCose}
			trapFocus={false}
			size="lg"
			title={<ModalTitle>Connection details</ModalTitle>}
		>
			<InheritAlert visible={!detailsValid && mergedValid} environment={envInfo?.name} />

			<Form onSubmit={saveInfo}>
				<ConnectionDetails value={infoDetails} onChange={setInfoDetails} placeholders={envInfo?.connection} optional />

				<Group mt="lg">
					<Button color={isLight ? "light.5" : "light.3"} variant="light" onClick={handleCose}>
						Close
					</Button>
					<Spacer />
					<Button type="submit" disabled={!mergedValid}>
						Save details
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}
