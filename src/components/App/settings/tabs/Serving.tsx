import { TextInput, NumberInput, Select, SimpleGrid } from "@mantine/core";
import { useStable } from "~/hooks/stable";
import { SettingsSection } from "../utilities";
import { useSetting } from "~/hooks/config";
import { LogLevel, Selection } from "~/types";

const CAT = "serving";

const DRIVERS = [
	{ label: "Memory", value: "memory" },
	{ label: "RocksDB", value: "file" },
	{ label: "SurrealKV", value: "surrealkv" },
	{ label: "TiKV", value: "tikv" },
];

const LOG_LEVELS: Selection<LogLevel> = [
	{ label: "Error", value: "error" },
	{ label: "Warn", value: "warn" },
	{ label: "Info", value: "info" },
	{ label: "Debug", value: "debug" },
	{ label: "Trace", value: "trace" },
];

export function ServingTab() {
	const [driver, setDriver] = useSetting(CAT, "driver");
	const [storage, setStorage] = useSetting(CAT, "storage");
	const [username, setUsername] = useSetting(CAT, "username");
	const [password, setPassword] = useSetting(CAT, "password");
	const [executable, setExecutable] = useSetting(CAT, "executable");
	const [logLevel, setLogLevel] = useSetting(CAT, "logLevel");
	const [historySize, setHistorySize] = useSetting(CAT, "historySize");
	const [port, setPort] = useSetting(CAT, "port");

	const isFileDriver = driver === "file";

	const updatePort = useStable((value: string | number) => {
		setPort(value as number);
	});

	const updateHistorySize = useStable((value: string | number) => {
		setHistorySize(value as number);
	});

	return (
		<>
			<SettingsSection>
				<NumberInput
					label="Serving port"
					value={port}
					onChange={updatePort}
					min={1}
					max={65_535}
				/>

				<SimpleGrid cols={2}>
					<Select
						w="unset"
						label="Log level"
						data={LOG_LEVELS}
						value={logLevel}
						onChange={setLogLevel as any}
					/>

					<NumberInput
						w="unset"
						label="Console history size"
						value={historySize}
						onChange={updateHistorySize}
						min={1}
						max={10_000}
					/>
				</SimpleGrid>

				<TextInput
					w="unset"
					label="SurrealDB executable path"
					value={executable}
					spellCheck={false}
					onChange={e => setExecutable(e.target.value)}
					placeholder="Leave empty to infer from $PATH"
				/>
			</SettingsSection>

			<SettingsSection label="Authentication">
				<SimpleGrid cols={2}>
					<TextInput
						w="unset"
						label="Initial root user"
						placeholder="root"
						value={username}
						spellCheck={false}
						onChange={e => setUsername(e.target.value)}
					/>

					<TextInput
						w="unset"
						label="Initial root password"
						placeholder="root"
						value={password}
						spellCheck={false}
						onChange={e => setPassword(e.target.value)}
					/>
				</SimpleGrid>
			</SettingsSection>

			<SettingsSection label="Storage">
				<SimpleGrid cols={2}>
					<Select
						w="unset"
						label="Storage mode"
						data={DRIVERS}
						value={driver}
						spellCheck={false}
						onChange={setDriver as any}
					/>

					{(driver === "file" || driver === "tikv") && (
						<TextInput
							w="unset"
							label={isFileDriver ? "Storage path" : "Storage cluster address"}
							placeholder={isFileDriver ? "/path/to/storage" : "address:port"}
							value={storage}
							spellCheck={false}
							onChange={e => setStorage(e.target.value)}
						/>
					)}
				</SimpleGrid>
			</SettingsSection>
		</>
	);
}
