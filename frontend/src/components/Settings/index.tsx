import { Button, Checkbox, ColorScheme, Divider, Group, Modal, Paper, Select, Stack, Switch, Text, Title, useMantineColorScheme } from "@mantine/core";
import { mdiCog } from "@mdi/js";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Icon } from "../Icon";
import { Spacer } from "../Scaffold/Spacer";

const THEMES = [
	{ label: 'Light', value: 'light' },
	{ label: 'Dark', value: 'dark' }
]

export function Settings() {
	const isLight = useIsLight();
	const colorScheme = useStoreValue(state => state.colorScheme);
	const autoConnect = useStoreValue(state => state.autoConnect);
	const tableSuggest = useStoreValue(state => state.tableSuggest);
	const [showSettings, setShowSettings] = useState(false);

	const version = import.meta.env.VERSION;
	const author = import.meta.env.AUTHOR;

	const openSettings = useStable(() => {
		setShowSettings(true);
	});

	const closeSettings = useStable(() => {
		setShowSettings(false);
	});

	const setColorScheme = useStable((scheme: ColorScheme) => {
		store.dispatch(actions.setColorScheme(scheme));
		updateConfig();
	});

	const setAutoConnect = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setAutoConnect(e.target.checked));
		updateConfig();	
	});

	const setTableSuggest = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setTableSuggest(e.target.checked));
		updateConfig();
	});

	return (
		<>
			<Button
				color={isLight ? 'light.0' : 'dark.4'}
				onClick={openSettings}
				px="xs"
			>
				<Icon
					path={mdiCog}
					color={isLight ? 'light.8' : 'white'}
				/>
			</Button>

			<Modal
				opened={showSettings}
				onClose={closeSettings}
				size="lg"
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Settings
					</Title>
				}
			>
				<Stack>
					<Checkbox
						label="Auto connect"
						checked={autoConnect}
						onChange={setAutoConnect}
					/>

					<Checkbox
						label="Suggest table names"
						checked={tableSuggest}
						onChange={setTableSuggest}
					/>

					<Select
						data={THEMES}
						label="Theme"
						value={colorScheme}
						onChange={setColorScheme}
					/>

					<Group>
						<Button color="light" onClick={closeSettings}>
							Close
						</Button>
						<Spacer />
						<Text color={isLight ? 'light.4' : 'dark.3'}>
							Version {version} by {author}
						</Text>
					</Group>
				</Stack>
			</Modal>
		</>
	)
}