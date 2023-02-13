import { Button, Checkbox, ColorScheme, Divider, Group, Modal, NumberInput, Paper, Select, SimpleGrid, Stack, Switch, Text, TextInput, Title, useMantineColorScheme } from "@mantine/core";
import { actions, store, useStoreValue } from "~/store";

import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { mdiCog } from "@mdi/js";
import { updateConfig } from "~/util/helpers";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { useState } from "react";
import { DriverType } from "~/typings";
import { adapter } from "~/adapter";

const THEMES = [
	{ label: 'Automatic', value: 'automatic' },
	{ label: 'Light', value: 'light' },
	{ label: 'Dark', value: 'dark' }
];

const DRIVERS = [
	{ label: 'Memory', value: 'memory' },
	{ label: 'File storage', value: 'file' },
	{ label: 'TiKV cluster', value: 'tikv' }
]

export function Settings() {
	const isLight = useIsLight();
	const config = useStoreValue(state => state.config);
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

	const setWordWrap = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setWordWrap(e.target.checked));
		updateConfig();
	});

	const setLocalDriver = useStable((driver: string) => {
		store.dispatch(actions.setLocalDatabaseDriver(driver as DriverType));
		updateConfig();
	});

	const setLocalPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setLocalDatabaseStorage(e.target.value));
		updateConfig();
	});

	const setConsoleEnabled = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setConsoleEnabled(e.target.checked));
		updateConfig();
	});

	const setQueryTimeout = useStable((value: number) => {
		store.dispatch(actions.setQueryTimeout(value));
		updateConfig();
	});

	const setUpdateChecker = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setUpdateChecker(e.target.checked));
		updateConfig();
	});

	return (
		<>
			<Button
				color={isLight ? 'light.0' : 'dark.4'}
				onClick={openSettings}
				title="Settings"
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
				<SimpleGrid cols={2}>
					<Stack style={{ height: '100%' }}>
						<Checkbox
							label="Auto connect"
							checked={config.autoConnect}
							onChange={setAutoConnect}
						/>

						<Checkbox
							label="Suggest table names"
							checked={config.tableSuggest}
							onChange={setTableSuggest}
						/>

						<Checkbox
							label="Wrap query results"
							checked={config.wordWrap}
							onChange={setWordWrap}
						/>

						{adapter.isServeSupported && (
							<Checkbox
								label="Enable database console"
								checked={config.enableConsole}
								onChange={setConsoleEnabled}
							/>
						)}

						{adapter.isUpdateCheckSupported && (
							<Checkbox
								label="Check for updates"
								checked={config.updateChecker}
								onChange={setUpdateChecker}
							/>
						)}

						<Spacer />

						<Text color={isLight ? 'light.4' : 'dark.3'}>
							Version {version} by {author}
						</Text>
					</Stack>
					<Stack>
						<Select
							data={THEMES}
							label="Theme"
							value={config.theme}
							onChange={setColorScheme}
						/>

						<NumberInput
							label="Query timeout (seconds)"
							value={config.queryTimeout}
							min={1}
							onChange={setQueryTimeout}
						/>

						<Select
							data={DRIVERS}
							label="Local database storage"
							value={config.localDriver}
							onChange={setLocalDriver}
						/>

						{config.localDriver === 'file' && (
							<TextInput
								label="Local database path"
								placeholder="/path/to/database"
								value={config.localStorage}
								onChange={setLocalPath}
							/>
						)}

						{config.localDriver === 'tikv' && (
							<TextInput
								label="Local database cluster address (WIP)"
								placeholder="address:port"
								value={config.localStorage}
								onChange={setLocalPath}
							/>
						)}
					</Stack>
				</SimpleGrid>

				{adapter.isPromotionSupported && (
					<Paper
						mt="xl"
						c="white"
						sx={theme => ({
							background: `url(/desktop.png), ${theme.fn.gradient()}`,
							overflow: 'hidden',
							backgroundSize: 'contain',
							backgroundRepeat: 'no-repeat',
							backgroundPosition: 'center right'
						})}
					>
						<Stack spacing="xs" p="md">
							<Text size="xl" weight={600}>
								Surrealist Desktop
							</Text>
							<Text style={{ maxWidth: '80%' }}>
								Download Surrealist for desktop to gain additional features including database running and offline support.
							</Text>
							<div>
								<a
									href="https://github.com/StarlaneStudios/Surrealist/releases"
									target="_blank"
								>
									<Button
										color="light.0"
										variant="outline"
									>
										Download
									</Button>
								</a>
							</div>
						</Stack>
					</Paper>
				)}
			</Modal>
		</>
	)
}