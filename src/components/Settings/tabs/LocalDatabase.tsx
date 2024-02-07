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
	const setLocalDatabaseDriver = useConfigStore((s) => s.setLocalDatabaseDriver);
	const setLocalDatabaseStorage = useConfigStore((s) => s.setLocalDatabaseStorage);
	const setSurrealUser = useConfigStore((s) => s.setSurrealUser);
	const setSurrealPass = useConfigStore((s) => s.setSurrealPass);
	const setSurrealPort = useConfigStore((s) => s.setSurrealPort);
	const setSurrealPath = useConfigStore((s) => s.setSurrealPath);

	const localDriver = useConfigStore((s) => s.localDriver);
	const localStorage = useConfigStore((s) => s.localStorage);
	const surrealUser = useConfigStore((s) => s.surrealUser);
	const surrealPass = useConfigStore((s) => s.surrealPass);
	const surrealPort = useConfigStore((s) => s.surrealPort);
	const surrealPath = useConfigStore((s) => s.surrealPath);

	const updateLocalDriver = useStable((driver: string | null) => {
		setLocalDatabaseDriver(driver as DriverType || 'file');
	});

	const updateLocalPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalDatabaseStorage(e.target.value);
	});

	const updateSurrealUser = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setSurrealUser(e.target.value);
	});

	const updateSurrealPass = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setSurrealPass(e.target.value);
	});

	const updateSurrealPort = useStable((value: any) => {
		setSurrealPort(value);
	});

	const updateSurrealPath = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		setSurrealPath(e.target.value);
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
