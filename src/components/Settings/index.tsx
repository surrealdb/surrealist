import { Button, Checkbox, ColorScheme, Divider, Group, Modal, NumberInput, Paper, Select, Stack, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { actions, store, useStoreValue } from "~/store";

import { Icon } from "../Icon";
import { mdiCog, mdiInformation } from "@mdi/js";
import { updateConfig } from "~/util/helpers";
import { useIsLight } from "~/hooks/theme";
import { useStable } from "~/hooks/stable";
import { PropsWithChildren, useState } from "react";
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

function SectionTitle({ isLight, children, first }: PropsWithChildren<{ isLight: boolean, first?: boolean }>) {
	return (
		<>
			<Title
				mt={first ? 0 : 38}
				mb={6}
				size={14}
				weight={600}
				color={isLight ? 'black' : 'white'}
			>
				{children}
			</Title>

			<Divider
				color={isLight ? 'light.0' : 'dark.5'}
				mb="sm"
			/>
		</>
	)
}

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

	const setSurrealUser = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setSurrealUser(e.target.value));
		updateConfig();
	});

	const setSurrealPass = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setSurrealPass(e.target.value));
		updateConfig();
	});

	const setSurrealPort = useStable((value: number) => {
		store.dispatch(actions.setSurrealPort(value));
		updateConfig();
	});

	const setQueryTimeout = useStable((value: number) => {
		store.dispatch(actions.setQueryTimeout(value));
		updateConfig();
	});

	const setSurrealPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setSurrealPath(e.target.value));
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
				size={580}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Settings
					</Title>
				}
			>
				{adapter.isPromotionSupported && (
					<Paper
						mb="xl"
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

				<SectionTitle isLight={isLight} first>
					General
				</SectionTitle>

				<Stack spacing="xs">
					{adapter.isUpdateCheckSupported && (
						<Checkbox
							label="Check for updates"
							checked={config.updateChecker}
							onChange={setUpdateChecker}
						/>
					)}

					<Checkbox
						label="Wrap query results"
						checked={config.wordWrap}
						onChange={setWordWrap}
					/>

					<Checkbox
						label="Suggest table names"
						checked={config.tableSuggest}
						onChange={setTableSuggest}
					/>

					<Select
						data={THEMES}
						label="Theme"
						value={config.theme}
						onChange={setColorScheme}
					/>
				</Stack>

				<SectionTitle isLight={isLight}>
					Connection
				</SectionTitle>

				<Stack spacing="xs">
					<Checkbox
						label="Auto connect to database"
						checked={config.autoConnect}
						onChange={setAutoConnect}
					/>

					<NumberInput
						label="Query timeout (seconds)"
						value={config.queryTimeout}
						min={1}
						onChange={setQueryTimeout}
					/>
				</Stack>
					
				{adapter.isServeSupported && (
					<>
						<SectionTitle isLight={isLight}>
							Local Database
						</SectionTitle>

						<Stack spacing="xs">
							<TextInput
								label="Root user"
								placeholder="root"
								value={config.surrealUser}
								onChange={setSurrealUser}
							/>

							<TextInput
								label="Root password"
								placeholder="root"
								value={config.surrealPass}
								onChange={setSurrealPass}
							/>

							<NumberInput
								label="Port"
								value={config.surrealPort}
								min={1}
								max={65535}
								onChange={setSurrealPort}
							/>

							<Select
								data={DRIVERS}
								label="Storage mode"
								value={config.localDriver}
								onChange={setLocalDriver}
							/>

							{config.localDriver === 'file' && (
								<TextInput
									label="Storage path"
									placeholder="/path/to/database"
									value={config.localStorage}
									onChange={setLocalPath}
								/>
							)}

							{config.localDriver === 'tikv' && (
								<TextInput
									label="Storage cluster address"
									placeholder="address:port"
									value={config.localStorage}
									onChange={setLocalPath}
								/>
							)}

							<TextInput
								value={config.surrealPath}
								onChange={setSurrealPath}
								label={
									<Group spacing={6} mb={4}>
										Surreal executable path
										<Tooltip
											label={
												<Text maw={305} style={{ whiteSpace: 'normal' }}>
													Leave empty to search for the Surreal executable in the PATH environment variable.
												</Text>
											}
										>
											<div>
												<Icon path={mdiInformation} size="sm" mt={-2} />
											</div>
										</Tooltip>
									</Group>
								}
							/>
						</Stack>
					</>
				)}

				<Text
					mt="xl"
					color={isLight ? 'light.4' : 'dark.3'}
				>
					Version {version} by {author}
				</Text>
			</Modal>
		</>
	)
}