import { Group, Modal, Paper, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { openModal } from "@mantine/modals";
import { useMemo, useState } from "react";
import { CodeSnippet } from "~/components/CodeSnippet";
import { DriverSelector } from "~/components/DriverSelector";
import { Icon } from "~/components/Icon";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DRIVERS } from "~/constants";
import type { CloudInstance, CodeLang, Snippets } from "~/types";
import { iconAPI, iconAccount, iconDatabase } from "~/util/icons";

export function openConnectSdk(instance: CloudInstance) {
	openModal({
		size: "lg",
		title: (
			<Group>
				<Icon
					path={iconAPI}
					size="xl"
				/>
				<PrimaryTitle>Connect with an SDK</PrimaryTitle>
			</Group>
		),
		withCloseButton: true,
		children: <ConnectSdkModal instance={instance} />,
	});
}

interface ConnectSdkModalProps {
	instance: CloudInstance;
}

function ConnectSdkModal({ instance }: ConnectSdkModalProps) {
	const [lang, setLang] = useState<CodeLang>("rust");

	const [namespace, setNamespace] = useInputState("");
	const [database, setDatabase] = useInputState("");
	const [username, setUsername] = useInputState("");
	const [password, setPassword] = useInputState("");

	const snippets = useMemo<Snippets>(
		() => ({
			js: `
				const db = new Surreal();

				// Open a connection and authenticate
				await db.connect("wss://${instance.host}", {
					namespace: "${namespace}",
					database: "${database}",
					auth: {
						username: "${username}",
						password: "${password}",
					}
				});
			`,
			csharp: `
				// Open a connection
				var db = new SurrealDbClient("wss://${instance.host}");

				// Select a namespace and database
				await db.Use("${namespace}", "${database}");

				// Authenticate
				await db.SignIn(new RootAuth
				{
					Username = "${username}",
					Password = "${password}",
				});
			`,
			py: `
				# Open a connection
				async with Surreal("wss://${instance.host}") as db:

					# Select a namespace and database
					await db.use("${namespace}", "${database}")

					# Authenticate
					await db.signin({
						"user": "${username}",
						"pass": "${password}"
					})
			`,
			php: `
				$db = new \\Surreal\\Surreal();

				// Open a connection
				$db->connect("wss://${instance.host}", [
					"namespace" => "${namespace}",
					"database" => "${database}",
				]);

				// Authenticate
				$db->signin([
					"username" => "${username}",
					"password" => "${password}",
				]);
			`,
			rust: `
				// Open a connection
				let db = any::connect("wss://${instance.host}").await?;

				// Select a namespace and database
				db.use_ns("${namespace}").use_db("${database}").await?;

				// Authenticate
				db.signin(Root {
					username: "${username}",
					password: "${password}",
				}).await?;
			`,
			java: `
				try (final Surreal db = new Surreal()) {
					
					// Open a connection
					db.connect("wss://${instance.host}");

					// Select a namespace and database
					db.useNs("${namespace}").useDb("${database}");

					// Authenticate
					db.signin(new Root("${username}", "${password}"));

				}
			`,
		}),
		[instance, namespace, database, username, password],
	);

	const driver = DRIVERS.find((d) => d.id === lang);

	return (
		<>
			<Stack>
				<Text size="lg">
					You can connect to this instance with your preferred language using one of our
					SurrealDB Client SDKs.
				</Text>

				<Text
					mt="lg"
					fz="lg"
					ff="mono"
					tt="uppercase"
					fw={600}
					c="bright"
				>
					1. Select your desired language
				</Text>

				<DriverSelector
					value={lang}
					onChange={setLang}
					exclude={["cli", "go", "c"]}
					cols={{
						base: 3,
						xs: 6,
					}}
				/>

				<Text
					mt="lg"
					fz="lg"
					ff="mono"
					tt="uppercase"
					fw={600}
					c="bright"
				>
					2. Enter optional connection details
				</Text>

				<SimpleGrid cols={2}>
					<Paper
						bg="slate.9"
						p="md"
					>
						<Group>
							<Icon path={iconDatabase} />
							<Text
								fw={500}
								c="bright"
							>
								Namespace and database
							</Text>
						</Group>
						<SimpleGrid
							cols={2}
							mt="lg"
						>
							<TextInput
								placeholder="Namespace"
								size="xs"
								value={namespace}
								onChange={setNamespace}
							/>

							<TextInput
								placeholder="Database"
								size="xs"
								value={database}
								onChange={setDatabase}
							/>
						</SimpleGrid>
					</Paper>
					<Paper
						bg="slate.9"
						p="md"
					>
						<Group>
							<Icon path={iconAccount} />
							<Text
								fw={500}
								c="bright"
							>
								Username and password
							</Text>
						</Group>
						<SimpleGrid
							cols={2}
							mt="lg"
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
					</Paper>
				</SimpleGrid>

				<Text
					mt="lg"
					fz="lg"
					ff="mono"
					tt="uppercase"
					fw={600}
					c="bright"
				>
					3. Use the following code snippet
				</Text>

				<CodeSnippet
					language={lang}
					values={snippets}
				/>

				{driver && (
					<LearnMore
						mt="sm"
						href={driver.link}
					>
						Learn more about the {driver.name} SDK
					</LearnMore>
				)}
			</Stack>
		</>
	);
}
