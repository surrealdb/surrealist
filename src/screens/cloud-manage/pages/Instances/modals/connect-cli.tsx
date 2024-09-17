import { Group, Modal, Text } from "@mantine/core";
import { useLayoutEffect, useState } from "react";
import { CodePreview } from "~/components/CodePreview";
import { Icon } from "~/components/Icon";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { fetchAPI } from "~/screens/cloud-manage/api";
import type { CloudInstance } from "~/types";
import { iconConsole } from "~/util/icons";

export interface ConnectCliModalProps {
	opened: boolean;
	onClose: () => void;
	instance: CloudInstance;
}

export function ConnectCliModal({
	opened,
	onClose,
	instance,
}: ConnectCliModalProps) {
	const [token, setToken] = useState("");

	useLayoutEffect(() => {
		if (opened) {
			fetchAPI<{ token: string }>(`/instances/${instance.id}/auth`).then(
				(response) => {
					setToken(response.token);
				},
			);
		}
	}, [opened, instance.id]);

	const endpoint = `wss://${instance.host}`;
	const command = token
		? `surreal sql --endpoint ${endpoint} --token ${token}`
		: "Loading...";

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			trapFocus={false}
			withCloseButton
			size="lg"
			title={
				<Group>
					<Icon path={iconConsole} size="xl" />
					<PrimaryTitle>Connect with the CLI</PrimaryTitle>
				</Group>
			}
		>
			<Text size="lg">
				Before connecting to this database, make sure you have the{" "}
				<Link href="https://surrealdb.com/docs/surrealdb/installation">
					SurrealDB CLI
				</Link>{" "}
				installed. Once it is installed, simply open the terminal of
				your choice and run the following command to connect to your
				Surreal Cloud instance.
			</Text>

			<CodePreview mt="xl" value={command} withCopy />
		</Modal>
	);
}
