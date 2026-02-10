import { Group, Paper, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { openModal } from "@mantine/modals";
import { Icon, iconTransfer } from "@surrealdb/ui";
import { CodePreview } from "~/components/CodePreview";
import { LearnMore } from "~/components/LearnMore";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsLight } from "~/hooks/theme";
import type { CloudInstance } from "~/types";

export function openConnectCurl(instance: CloudInstance, namespace: string, database: string) {
	openModal({
		size: "lg",
		title: (
			<Group>
				<Icon
					path={iconTransfer}
					size="xl"
				/>
				<PrimaryTitle>Connect with HTTP using cURL</PrimaryTitle>
			</Group>
		),
		withCloseButton: true,
		children: (
			<ConnectCurlModal
				instance={instance}
				namespace={namespace}
				database={database}
			/>
		),
	});
}

interface ConnectCurlModalProps {
	instance: CloudInstance;
	namespace: string;
	database: string;
}

function ConnectCurlModal({ instance, namespace, database }: ConnectCurlModalProps) {
	const isLight = useIsLight();

	const [username, setUsername] = useInputState("");
	const [password, setPassword] = useInputState("");

	let command = `curl -X GET "https://${instance.host}/version"`;

	if (namespace) {
		command += ` \\\n  -H "Surreal-NS: ${namespace}"`;
	}

	if (database) {
		command += ` \\\n  -H "Surreal-DB: ${database}"`;
	}

	if (username || password) {
		command += ` \\\n  -u "${username}:${password}"`;
	}

	return (
		<Stack>
			<Text size="lg">
				You can connect to this instance using{" "}
				<Link href="https://surrealdb.com/docs/surrealdb/integration/http">
					HTTP requests
				</Link>
				. The following example demonstrates how to use cURL to communicate with this
				instance.
			</Text>

			<Text
				mt="xl"
				fz="xl"
				ff="mono"
				tt="uppercase"
				fw={600}
				c="bright"
			>
				Authentication
			</Text>

			<Paper
				bg={isLight ? "slate.0" : "slate.9"}
				p="md"
			>
				<SimpleGrid
					cols={2}
					mb="md"
				>
					<TextInput
						placeholder="Username"
						size="xs"
						value={username}
						onChange={setUsername}
					/>

					<TextInput
						placeholder="Password"
						size="xs"
						value={password}
						onChange={setPassword}
					/>
				</SimpleGrid>

				<LearnMore href="https://surrealdb.com/docs/surrealdb/security/authentication">
					Learn more about authentication
				</LearnMore>
			</Paper>

			<Text
				mt="xl"
				fz="xl"
				ff="mono"
				tt="uppercase"
				fw={600}
				c="bright"
			>
				Execute HTTP request
			</Text>

			<CodePreview
				language="bash"
				withCopy
				value={command}
			/>

			<LearnMore
				mt="sm"
				href="https://surrealdb.com/docs/surrealdb/integration/http"
			>
				Learn more about the HTTP protocol
			</LearnMore>
		</Stack>
	);
}
