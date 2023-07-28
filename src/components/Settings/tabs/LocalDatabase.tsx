import { Stack, TextInput, NumberInput, Select, Group, Tooltip, Box } from "@mantine/core";
import { mdiInformation } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { store, actions } from "~/store";
import { DriverType, SurrealistConfig } from "~/types";
import { updateConfig } from "~/util/helpers";
import { Setting } from "../setting";

const DRIVERS = [
	{ label: 'Memory', value: 'memory' },
	{ label: 'File storage', value: 'file' },
	{ label: 'TiKV cluster', value: 'tikv' }
];

export interface ConnectionTabProps {
	config: SurrealistConfig;
}

export function LocalDatabaseTab({ config }: ConnectionTabProps) {

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

	const setSurrealPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(actions.setSurrealPath(e.target.value));
		updateConfig();
	});


	return (
		<Stack spacing="xs">
			<Setting label="Root user">
				<TextInput
					placeholder="root"
					value={config.surrealUser}
					onChange={setSurrealUser}
					w={250}
				/>
			</Setting>

			<Setting label="Root password">
				<TextInput
					placeholder="root"
					value={config.surrealPass}
					onChange={setSurrealPass}
					w={250}
				/>
			</Setting>

			<Setting label="Port">
				<NumberInput
					value={config.surrealPort}
					min={1}
					max={65_535}
					onChange={setSurrealPort}
					w={250}
				/>
			</Setting>

			<Setting label="Storage mode">
				<Select
					data={DRIVERS}
					value={config.localDriver}
					onChange={setLocalDriver}
					w={250}
				/>
			</Setting>

			{config.localDriver === 'file' && (
				<Setting label="Storage path">
					<TextInput
						placeholder="/path/to/database"
						value={config.localStorage}
						onChange={setLocalPath}
						w={250}
					/>
				</Setting>
			)}

			{config.localDriver === 'tikv' && (
				<Setting label="Storage cluster address">
					<TextInput
						placeholder="address:port"
						value={config.localStorage}
						onChange={setLocalPath}
						w={250}
					/>
				</Setting>
			)}

			<Setting label={
				<Tooltip
					position="right"
					label={
						<Box w={200} style={{ whiteSpace: 'pre-wrap' }}>
							Leave empty to search for the Surreal executable in the PATH environment variable.
						</Box>
					}
				>
					<Group spacing={6}>
						Surreal executable path
						<Icon path={mdiInformation} size="sm" mt={-2} />
					</Group>
				</Tooltip>
			}>
				<TextInput
					value={config.surrealPath}
					onChange={setSurrealPath}
					w={250}
				/>
			</Setting>
		</Stack>
	);
}