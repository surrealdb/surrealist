import { NumberInput, ScrollArea, Select, SimpleGrid, Text, TextInput } from "@mantine/core";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import type { LogLevel, Selection } from "~/types";
import { SettingsSection } from "../utilities";

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

	const isFileDriver = driver === "file" || driver === "surrealkv";

	const updatePort = useStable((value: string | number) => {
		setPort(value as number);
	});

	const updateHistorySize = useStable((value: string | number) => {
		setHistorySize(value as number);
	});

	return (
		<ScrollArea
			pr="xl"
			flex={1}
			scrollbars="y"
			type="always"
			pb={32}
		>
			<Text
				mb="xl"
				maw={500}
			>
				You can use Surrealist Desktop to serve SurrealDB on your local machine.
				<br />
				This page allows you to customize the settings for the database.
			</Text>

			<SettingsSection
				label="Options"
				maw={400}
			>
				<NumberInput
					label="Serving port"
					value={port}
					onChange={updatePort}
					min={1}
					max={65_535}
				/>

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

				<TextInput
					w="unset"
					label="SurrealDB executable path"
					value={executable}
					spellCheck={false}
					onChange={(e) => setExecutable(e.target.value)}
					placeholder="Leave empty to infer from $PATH"
				/>
			</SettingsSection>

			<SettingsSection
				mt="xl"
				maw={400}
				label="Authentication"
			>
				<TextInput
					w="unset"
					label="Initial root user"
					placeholder="root"
					value={username}
					spellCheck={false}
					onChange={(e) => setUsername(e.target.value)}
				/>

				<TextInput
					w="unset"
					label="Initial root password"
					placeholder="root"
					value={password}
					spellCheck={false}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</SettingsSection>

			<SettingsSection
				mt="xl"
				maw={400}
				label="Storage"
			>
				<Select
					w="unset"
					label="Storage mode"
					data={DRIVERS}
					value={driver}
					spellCheck={false}
					onChange={setDriver as any}
				/>

				{(driver === "file" || driver === "tikv" || driver === "surrealkv") && (
					<TextInput
						w="unset"
						label={isFileDriver ? "Storage path" : "Storage cluster address"}
						placeholder={isFileDriver ? "/path/to/storage" : "address:port"}
						value={storage}
						spellCheck={false}
						onChange={(e) => setStorage(e.target.value)}
					/>
				)}
			</SettingsSection>
		</ScrollArea>
	);
}
