import { Text } from "@mantine/core";
import {
	Box,
	Button,
	Collapse,
	Flex,
	Group,
	PasswordInput,
	Select,
	Stack,
	TextInput,
} from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { Updater } from "use-immer";
import { useConfirmation } from "~/providers/Confirmation";
import { Authentication, Connection, SshTunnel } from "~/types";

export interface ConnectionSshDetailsProps {
	value: Connection;
	onChange: Updater<Connection>;
}

export function ConnectionSshDetails({ value, onChange }: ConnectionSshDetailsProps) {
	const [testingConnection, setTestingConnection] = useState(false);
	const missingFields = !value.authentication.ssh?.host || !value.authentication.ssh?.username;
	const editable = !testingConnection;

	const sshTunnel: SshTunnel = value.authentication.ssh ?? {
		host: "",
		port: 22,
		username: "",
		authMethod: {
			type: "password",
			password: "",
		},
	};

	const handleSshChange = <K extends keyof SshTunnel>(field: K, val: SshTunnel[K]) => {
		onChange((draft) => {
			draft.authentication.ssh = {
				...((draft.authentication.ssh ?? {
					host: "",
					port: 22,
					username: "",
					authMethod: {
						type: "password",
						password: "",
					},
				}) as SshTunnel),
				[field]: val,
			};
		});
	};

	const handleSshAuthChange = (val: string, field: string) => {
		onChange((draft) => {
			if (!draft.authentication.ssh) return;

			const authMethod = draft.authentication.ssh.authMethod;
			switch (field) {
				case "type":
					authMethod.type = val as SshTunnel["authMethod"]["type"];
					break;
				case "password":
					if (authMethod.type === "password") {
						authMethod.password = val;
					}
					break;
				case "privateKey":
				case "passphrase":
					if (authMethod.type === "publicKey") {
						authMethod[field] = val;
					}
					break;
			}
		});
	};

	const confirmHostFingerprint = useConfirmation<{
		hostname: string;
		fingerprint: string;
	}>({
		title: "Unknown Host Fingerprint",
		message: (value) => (
			<Stack>
				<Text>
					The authenticity of host 'localhost (127.0.0.1)' can't be established. ED25519
					key fingerprint is SHA256:XkoiPCGHpxdNPkNOYVYDRID6s/PRJldOkJ1vIZW34Nc. This key
					is not known by any other names. Are you sure you want to continue connecting
					(yes/no/[fingerprint])?
				</Text>
				<Text>{value}</Text>
			</Stack>
		),
		onConfirm: () => {
			console.log("WIP: unknown host fingerprint");
		},
	});

	const handleTestConnection = async () => {
		setTestingConnection(true);
		const unlisten = await listen("ssh:unknown-host-fingerprint", async (event) => {
			console.log("ssh:unknown-host-fingerprint", event);
			await new Promise((resolve) => setTimeout(resolve, 5000));
			emit(
				"ssh:unknown-host-fingerprint:reply",
				(event.payload as string[]).at(
					Math.floor(Math.random() * (event.payload as string[]).length),
				),
			);
		});
		await invoke("test_ssh_connection", {
			config: value.authentication.ssh,
		}).finally(() => {
			setTestingConnection(false);
			unlisten();
		});
	};

	return (
		<Box>
			<Group
				mt="sm"
				grow
			>
				<TextInput
					flex={1}
					label="SSH Host"
					placeholder="127.0.0.1"
					value={sshTunnel.host || ""}
					onChange={(e) => handleSshChange("host", e.currentTarget.value)}
					disabled={!editable}
				/>
				<TextInput
					flex={0.2}
					label="SSH Port"
					type="number"
					placeholder="22"
					value={sshTunnel.port ?? 22}
					onChange={(e) => handleSshChange("port", Number(e.currentTarget.value))}
					disabled={!editable}
				/>
			</Group>
			<Group
				mt="sm"
				grow
			>
				<TextInput
					label="SSH Username"
					placeholder="user"
					value={sshTunnel.username || ""}
					onChange={(e) => handleSshChange("username", e.currentTarget.value)}
					disabled={!editable}
				/>
				<Select
					label="SSH Auth Method"
					data={[
						{ label: "Password", value: "password" },
						{ label: "Public Key", value: "publicKey" },
						// { label: "Agent", value: "agent" },
					]}
					value={sshTunnel.authMethod.type}
					onChange={(value) =>
						handleSshAuthChange(value as SshTunnel["authMethod"]["type"], "type")
					}
					disabled={!editable}
				/>
			</Group>
			{sshTunnel && (
				<Flex
					mt="sm"
					gap="sm"
					direction="column"
				>
					{sshTunnel.authMethod.type === "password" && (
						<PasswordInput
							label="SSH Password (optional)"
							placeholder="Password"
							value={sshTunnel.authMethod.password || ""}
							onChange={(e) => handleSshAuthChange(e.currentTarget.value, "password")}
							disabled={!editable}
						/>
					)}
					{sshTunnel.authMethod.type === "publicKey" && (
						<>
							<TextInput
								label="SSH Private Key (optional)"
								placeholder="Paste private key here"
								value={sshTunnel.authMethod.privateKey || ""}
								onChange={(e) =>
									handleSshAuthChange(e.currentTarget.value, "privateKey")
								}
								disabled={!editable}
							/>
							<TextInput
								label="SSH Passphrase (optional)"
								placeholder="Passphrase"
								value={sshTunnel.authMethod.passphrase || ""}
								onChange={(e) =>
									handleSshAuthChange(e.currentTarget.value, "passphrase")
								}
								disabled={!editable}
							/>
						</>
					)}
				</Flex>
			)}

			<Group
				mt="sm"
				justify="flex-end"
			>
				<Button
					color="slate"
					variant="light"
					onClick={handleTestConnection}
					loading={testingConnection}
					disabled={missingFields || testingConnection}
					loaderProps={{ type: "dots" }}
				>
					Test Connection
				</Button>
			</Group>
		</Box>
	);
}
