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
import { useInputState } from "@mantine/hooks";
import { useEffect } from "react";
import { newId, updateConfig, updateTitle } from "~/util/helpers";
import { useEnvironmentList, useTabsList } from "~/hooks/environment";
import { InheritAlert } from "../InheritAlert/interface";

export function TabCreator() {
	const isLight = useIsLight();
	const tabs = useTabsList();
	const environments = useEnvironmentList();
	const opened = useStoreValue(state => state.showTabCreator);
	const creation = useStoreValue(state => state.tabCreation);

	const [tabName, setTabName] = useInputState('');
	const [infoDetails, setInfoDetails] = useImmer<SurrealConnection>(createEmptyConnection());

	const finalEnv = creation?.environment || environments[0].id;
	const envInfo = environments.find(env => env.id === finalEnv);
	const envTabs = tabs.filter(tab => tab.environment === finalEnv);
	const mergedDetails = mergeConnections(infoDetails, envInfo?.connection || {});

	const detailsValid = isConnectionValid(infoDetails);
	const mergedValid = isConnectionValid(mergedDetails);

	const handleCose = useStable(() => {
		store.dispatch(actions.closeTabCreator());
	})

	const saveInfo = useStable(() => {
		handleCose();

		const tabId = newId();

		store.dispatch(actions.addTab({
			id: tabId,
			name: tabName,
			environment: finalEnv,
			query: creation?.query || '',
			variables: '{}',
			lastResponse: [],
			activeView: 'query',
			connection: infoDetails,
			pinned: false
		}));

		store.dispatch(actions.setActiveTab(tabId));

		updateTitle();
		updateConfig();
	});

	useEffect(() => {
		if (opened) {
			function buildName(n: number) {
				return `${creation?.name || 'New session'} ${n ? n + 1 : ''}`.trim();
			}

			let tabName = '';
			let counter = 0;

			do {
				tabName = buildName(counter);
				counter++;
			} while (envTabs.find(tab => tab.name === tabName));

			setTabName(tabName);
			setInfoDetails({
				...createEmptyConnection(),
				...creation?.connection
			});
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
					Create session
				</Title>
			}
		>
			<TextInput
				label="Tab name"
				value={tabName}
				onChange={setTabName}
				autoFocus
				mb="lg"
			/>

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