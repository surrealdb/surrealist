import { Modal, Title, Alert, Group, Button, TextInput } from "@mantine/core";
import { mdiInformation } from "@mdi/js";
import { ConnectionDetails } from "../ConnectionDetails";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { useIsLight } from "~/hooks/theme";
import { useImmer } from "use-immer";
import { SurrealConnection } from "~/surreal";
import { createEmptyConnection, isConnectionValid, mergeConnections } from "~/util/environments";
import { useStable } from "~/hooks/stable";
import { actions, store, useStoreValue } from "~/store";
import { Form } from "../Form";
import { useEffect } from "react";
import { updateConfig, updateTitle } from "~/util/helpers";
import { useEnvironmentList, useTabsList } from "~/hooks/environment";
import { InheritAlert } from "../InheritAlert/interface";

export interface TabEditorProps {
	onActiveChange: () => Promise<unknown>;
}

export function TabEditor({ onActiveChange }: TabEditorProps) {
	const isLight = useIsLight();
	const tabs = useTabsList();
	const environments = useEnvironmentList();
	const activeTabId = useStoreValue(state => state.config.activeTab);
	const opened = useStoreValue(state => state.showTabEditor);
	const editingId = useStoreValue(state => state.editingId);

	const [infoDetails, setInfoDetails] = useImmer<SurrealConnection>(createEmptyConnection());

	const tabInfo = tabs.find(tab => tab.id === editingId);
	const envInfo = environments.find(env => env.id === tabInfo?.environment);
	const mergedDetails = mergeConnections(infoDetails, envInfo?.connection || {});

	const detailsValid = isConnectionValid(infoDetails);
	const mergedValid = isConnectionValid(mergedDetails);

	const handleCose = useStable(() => {
		store.dispatch(actions.closeTabEditor());
	})

	const saveInfo = useStable(async () => {
		handleCose();

		store.dispatch(actions.updateTab({
			id: editingId,
			connection: infoDetails
		}));

		if (activeTabId == editingId) {
			await onActiveChange();
		}

		updateTitle();
		updateConfig();
	});

	useEffect(() => {
		if (opened) {
			const tab = tabs.find(tab => tab.id === editingId);

			setInfoDetails(tab?.connection || createEmptyConnection());
		}
	}, [opened]);

	return (
		<Modal
			opened={opened}
			onClose={handleCose}
			trapFocus={false}
			size="lg"
			title={
				<Title size={16} color={isLight ? 'light.6' : 'white'}>
					Connection details
				</Title>
			}
		>
			<InheritAlert
				visible={!detailsValid && mergedValid}
				environment={envInfo?.name}
			/>

			<Form onSubmit={saveInfo}>
				<ConnectionDetails
					value={infoDetails}
					onChange={setInfoDetails}
					placeholders={envInfo?.connection}
					optional
				/>

				<Group mt="lg">
					<Button
						color={isLight ? 'light.5' : 'light.3'}
						variant="light"
						onClick={handleCose}
					>
						Close
					</Button>
					<Spacer />
					<Button
						type="submit"
						disabled={!mergedValid}
					>
						Save details
					</Button>
				</Group>
			</Form>
		</Modal>
	);
}