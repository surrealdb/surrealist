import { Stack, TextInput, NumberInput, Select, Group, Tooltip, Box } from "@mantine/core";
import { mdiInformation } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { store } from "~/store";
import { DriverType, SurrealistConfig } from "~/types";
import { Setting } from "../setting";
import { setLocalDatabaseDriver, setLocalDatabaseStorage, setSurrealUser, setSurrealPass, setSurrealPort, setSurrealPath } from "~/stores/config";

const DRIVERS = [
	{ label: "Memory", value: "memory" },
	{ label: "File storage", value: "file" },
	{ label: "TiKV cluster", value: "tikv" },
];

export interface ConnectionTabProps {
	config: SurrealistConfig;
}

export function LocalDatabaseTab({ config }: ConnectionTabProps) {
	const updateLocalDriver = useStable((driver: string) => {
		store.dispatch(setLocalDatabaseDriver(driver as DriverType));
	});

	const updateLocalPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setLocalDatabaseStorage(e.target.value));
	});

	const updateSurrealUser = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setSurrealUser(e.target.value));
	});

	const updateSurrealPass = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setSurrealPass(e.target.value));
	});

	const updateSurrealPort = useStable((value: number) => {
		store.dispatch(setSurrealPort(value));
	});

	const updateSurrealPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		store.dispatch(setSurrealPath(e.target.value));
	});

	return (
		<Stack spacing="xs">
			<Setting label="Initial root user">
				<TextInput placeholder="root" value={config.surrealUser} onChange={updateSurrealUser} w={250} />
			</Setting>

			<Setting label="Initial root password">
				<TextInput placeholder="root" value={config.surrealPass} onChange={updateSurrealPass} w={250} />
			</Setting>

			<Setting label="Port">
				<NumberInput value={config.surrealPort} min={1} max={65_535} onChange={updateSurrealPort} w={250} />
			</Setting>

			<Setting label="Storage mode">
				<Select data={DRIVERS} value={config.localDriver} onChange={updateLocalDriver} w={250} />
			</Setting>

			{config.localDriver === "file" && (
				<Setting label="Storage path">
					<TextInput placeholder="/path/to/database" value={config.localStorage} onChange={updateLocalPath} w={250} />
				</Setting>
			)}

			{config.localDriver === "tikv" && (
				<Setting label="Storage cluster address">
					<TextInput placeholder="address:port" value={config.localStorage} onChange={updateLocalPath} w={250} />
				</Setting>
			)}

			<Setting
				label={
					<Tooltip
						position="right"
						label={
							<Box w={200} style={{ whiteSpace: "pre-wrap" }}>
								Leave empty to search for the Surreal executable in the PATH environment variable.
							</Box>
						}>
						<Group spacing={6}>
							Surreal executable path
							<Icon path={mdiInformation} size="sm" mt={-2} />
						</Group>
					</Tooltip>
				}>
				<TextInput value={config.surrealPath} onChange={updateSurrealPath} w={250} />
			</Setting>
		</Stack>
	);
}
