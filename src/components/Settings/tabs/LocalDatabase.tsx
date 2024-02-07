import { Stack, TextInput, NumberInput, Select, Group, Tooltip, Box } from "@mantine/core";
import { mdiInformation } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { useStable } from "~/hooks/stable";
import { DriverType } from "~/types";
import { Setting } from "../setting";
import { useConfigStore } from "~/stores/config";

const DRIVERS = [
	{ label: "Memory", value: "memory" },
	{ label: "File storage", value: "file" },
	{ label: "TiKV cluster", value: "tikv" },
];

export function LocalDatabaseTab() {
	const {
		setLocalSurrealDriver,
		setLocalSurrealStorage,
		setLocalSurrealUser,
		setLocalSurrealPass,
		setLocalSurrealPort,
		setLocalSurrealPath
	} = useConfigStore.getState();
	
	const localDriver = useConfigStore((s) => s.localSurrealDriver);
	const localStorage = useConfigStore((s) => s.localSurrealStorage);
	const surrealUser = useConfigStore((s) => s.localSurrealUser);
	const surrealPass = useConfigStore((s) => s.localSurrealPass);
	const surrealPort = useConfigStore((s) => s.localSurrealPort);
	const surrealPath = useConfigStore((s) => s.localSurrealPath);

	const updateLocalDriver = useStable((driver: string | null) => {
		setLocalSurrealDriver(driver as DriverType || 'file');
	});

	const updateLocalPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalSurrealStorage(e.target.value);
	});

	const updateSurrealUser = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalSurrealUser(e.target.value);
	});

	const updateSurrealPass = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalSurrealPass(e.target.value);
	});

	const updateSurrealPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalSurrealPath(e.target.value);
	});

	const updateSurrealPort = useStable((port: string | number) => {
		setLocalSurrealPort(port as number);
	});

	return (
		<Stack gap="xs">
			<Setting label="Initial root user">
				<TextInput placeholder="root" value={surrealUser} onChange={updateSurrealUser} w={250} />
			</Setting>

			<Setting label="Initial root password">
				<TextInput placeholder="root" value={surrealPass} onChange={updateSurrealPass} w={250} />
			</Setting>

			<Setting label="Port">
				<NumberInput value={surrealPort} min={1} max={65_535} onChange={updateSurrealPort} w={250} />
			</Setting>

			<Setting label="Storage mode">
				<Select data={DRIVERS} value={localDriver} onChange={updateLocalDriver} w={250} />
			</Setting>

			{localDriver === "file" && (
				<Setting label="Storage path">
					<TextInput placeholder="/path/to/database" value={localStorage} onChange={updateLocalPath} w={250} />
				</Setting>
			)}

			{localDriver === "tikv" && (
				<Setting label="Storage cluster address">
					<TextInput placeholder="address:port" value={localStorage} onChange={updateLocalPath} w={250} />
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
						<Group gap={6}>
							Surreal executable path
							<Icon path={mdiInformation} size="sm" mt={-2} />
						</Group>
					</Tooltip>
				}>
				<TextInput value={surrealPath} onChange={updateSurrealPath} w={250} />
			</Setting>
		</Stack>
	);
}
