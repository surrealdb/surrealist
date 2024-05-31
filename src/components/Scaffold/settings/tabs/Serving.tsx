import { NumberInput, Select, TextInput } from "@mantine/core";
import { useSetting } from "~/hooks/config";
import { useStable } from "~/hooks/stable";
import { SettingsSection } from "../utilities";

const CAT = "serving";

const DRIVERS = [
	{ label: "Memory", value: "memory" },
	{ label: "File storage", value: "file" },
	{ label: "TiKV cluster", value: "tikv" },
];

export function ServingTab() {
	const [driver, setDriver] = useSetting(CAT, "driver");
	const [storage, setStorage] = useSetting(CAT, "storage");
	const [username, setUsername] = useSetting(CAT, "username");
	const [password, setPassword] = useSetting(CAT, "password");
	const [executable, setExecutable] = useSetting(CAT, "executable");
	const [port, setPort] = useSetting(CAT, "port");

	const isFileDriver = driver === "file";

	const updatePort = useStable((value: string | number) => {
		setPort(value as number);
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

				<TextInput
					label="Initial root user"
					placeholder="root"
					value={username}
					spellCheck={false}
					onChange={(e) => setUsername(e.target.value)}
				/>

				<TextInput
					label="Initial root password"
					placeholder="root"
					value={password}
					spellCheck={false}
					onChange={(e) => setPassword(e.target.value)}
				/>

				<Select
					label="Storage mode"
					data={DRIVERS}
					value={driver}
					spellCheck={false}
					onChange={setDriver as any}
				/>

				{(driver === "file" || driver === "tikv") && (
					<TextInput
						label={isFileDriver ? "Storage path" : "Storage cluster address"}
						placeholder={isFileDriver ? "/path/to/storage" : "address:port"}
						value={storage}
						spellCheck={false}
						onChange={(e) => setStorage(e.target.value)}
					/>
				)}

				<TextInput
					label="SurrealDB executable path"
					value={executable}
					spellCheck={false}
					onChange={(e) => setExecutable(e.target.value)}
				/>
			</SettingsSection>
		</>
	);
}
