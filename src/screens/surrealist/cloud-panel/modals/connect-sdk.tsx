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
import { useIsLight } from "~/hooks/theme";
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
	const isLight = useIsLight();
	const [lang, setLang] = useState<CodeLang>("rust");

	const [namespace, setNamespace] = useInputState("");
	const [database, setDatabase] = useInputState("");
	const [username, setUsername] = useInputState("");
	const [password, setPassword] = useInputState("");

	const snippets = useMemo<Snippets>(
		() => ({
			js: `
				import { Surreal, RecordID } from "surrealdb";
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
				// Create record
				await db.create(new RecordID("person"), {
					first: "John",
					last: "Doe",
					marketing: true,
					tags: ["python", "documentation"],
				});

				// Select all records in person table
				console.log(await db.select("person"));

				await db.close();
			`,
			csharp: `

				using SurrealDb.Net;
				using SurrealDb.Net.Models;
				using SurrealDb.Net.Models.Auth;
				using System.Text.Json;
				
				const string TABLE = "person";
				
				using var db = new SurrealDbClient("wss://${instance.host}/rpc");
				
				await db.SignIn(new RootAuth { Username = "${username}", Password = "${password}" });
				await db.Use("${namespace}", "${database}");
				
				var person = new Person
				{
					Title = "Founder & CEO",
					Name = new() { FirstName = "Tobie", LastName = "Morgan Hitchcock" },
					Marketing = true
				};
				var created = await db.Create(TABLE, person);
				Console.WriteLine(ToJsonString(created));
				
				var updated = await db.Merge<ResponsibilityMerge, Person>(
					new() { Id = (TABLE, "jaime"), Marketing = true }
				);
				Console.WriteLine(ToJsonString(updated));
				
				var people = await db.Select<Person>(TABLE);
				Console.WriteLine(ToJsonString(people));
				
				var queryResponse = await db.Query(
					$"SELECT Marketing, count() AS Count FROM type::table({TABLE}) GROUP BY Marketing"
				);
				var groups = queryResponse.GetValue<List<Group>>(0);
				Console.WriteLine(ToJsonString(groups));
				
				static string ToJsonString(object? o)
				{
					return JsonSerializer.Serialize(o, new JsonSerializerOptions { WriteIndented = true, });
				}
				
				public class Person : Record
				{
					public string? Title { get; set; }
					public Name? Name { get; set; }
					public bool Marketing { get; set; }
				}
				public class Name
				{
					public string? FirstName { get; set; }
					public string? LastName { get; set; }
				}
				public class ResponsibilityMerge : Record
				{
					public bool Marketing { get; set; }
				}
				public class Group
				{
					public bool Marketing { get; set; }
					public int Count { get; set; }
				}
			`,
			py: `
from surrealdb import Surreal, RecordID

				# Open a connection
				with Surreal(url="wss://${instance.host}") as db:

					# Select a namespace and database
					db.use("${namespace}", "${database}")

					# Authenticate
					db.signin(username="${username}", password="${password}")

					# Create a record
					db.create(RecordID("grocery", "1"), {
						"name": "Banana",
						"quantity": 10,
					})

					# Select a specific record
					print(db.select(RecordID("grocery", "1")))
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
				use serde::{Deserialize, Serialize};
				use surrealdb::engine::any;
				use surrealdb::opt::auth::Root;
				use tokio;

				#[derive(Debug, Serialize, Deserialize)]
				struct Person {
					name: String,
				}

				#[tokio::main]
				async fn main() -> Result<(), Box<dyn std::error::Error>> {
					// Open a connection
					let db = any::connect("wss://${instance.host}").await?;

					// Select a namespace and database
					db.use_ns("${namespace}").use_db("${database}").await?;

					// Authenticate
					db.signin(Root {
						username: "${username}",
						password: "${password}",
					}).await?;

					db.query("CREATE person:john SET name = 'John Doe', age = 25").await?.check()?;

					// Query that person
					let john: Option<Person> = db.select(("person", "john")).await?;
					dbg!(john);

				Ok(())
				}
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
					mt="xl"
					fz="xl"
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
					mt="xl"
					fz="xl"
					ff="mono"
					tt="uppercase"
					fw={600}
					c="bright"
				>
					2. Specify namespace and database
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

					<LearnMore href="https://surrealdb.com/docs/surrealdb/introduction/concepts/namespace">
						Learn more about namespaces and databases
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
					3. Authentication
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
					4. Use the following code snippet
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
