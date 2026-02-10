import { Group, Stack, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { Icon, iconXml } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { CodeSnippet } from "~/components/CodeSnippet";
import { DriverSelector } from "~/components/DriverSelector";
import { LearnMore } from "~/components/LearnMore";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { DRIVERS } from "~/constants";
import type { CloudInstance, CodeLang, Snippets } from "~/types";

export function openConnectSdk(instance: CloudInstance, namespace: string, database: string) {
	openModal({
		size: "lg",
		title: (
			<Group>
				<Icon
					path={iconXml}
					size="xl"
				/>
				<PrimaryTitle>Connect with an SDK</PrimaryTitle>
			</Group>
		),
		withCloseButton: true,
		children: (
			<ConnectSdkModal
				instance={instance}
				namespace={namespace}
				database={database}
			/>
		),
	});
}

interface ConnectSdkModalProps {
	instance: CloudInstance;
	namespace: string;
	database: string;
}

function ConnectSdkModal({ instance, namespace, database }: ConnectSdkModalProps) {
	const [lang, setLang] = useState<CodeLang>("rust");

	const installation = useMemo<Snippets>(
		() => ({
			js: `npm install --save surrealdb`,
			csharp: `dotnet add package SurrealDb.Net`,
			py: `pip install surrealdb`,
			php: `composer require surrealdb/surrealdb.php`,
			rust: `
				cargo add surrealdb;
				cargo add tokio --features macros,rt-multi-thread
				cargo add serde --features derive
			`,
			java: `
				// Maven
				<dependency>
					<groupId>com.surrealdb</groupId>
					<artifactId>surrealdb</artifactId>
					<version>0.2.1</version>
				</dependency>

				// Gradle
				dependencies {
					implementation "com.surrealdb:surrealdb:0.2.1"
				}
			`,
		}),
		[],
	);

	const snippets = useMemo<Snippets>(
		() => ({
			js: `
				import { Surreal, Table } from "surrealdb";

				const db = new Surreal();

				// Open a connection and authenticate
				await db.connect("wss://${instance.host}", {
					namespace: "${namespace}",
					database: "${database}",
					auth: {
						username: "",
						password: "",
					}
				});
				
				// Create record
				await db.create(new Table("project"), {
					name: "SurrealDB Dashboard",
					description: "A modern admin interface for SurrealDB",
					status: "in_progress",
					priority: "high",
					tags: ["typescript", "react", "database"],
					created_at: new Date(),
				});

				// Select all records in project table
				console.log(await db.select(new Table("project")));

				await db.close();
			`,
			csharp: `
				using SurrealDb.Net;
				using SurrealDb.Net.Models;
				using SurrealDb.Net.Models.Auth;
				using System.Text.Json;
				
				const string TABLE = "project";
				
				using var db = new SurrealDbClient("wss://${instance.host}/rpc");

				// Select namespace and database
				await db.Use("${namespace}", "${database}");
				
				// Create record
				var project = new Project
				{
					Name = "SurrealDB Dashboard",
					Description = "A modern admin interface for SurrealDB",
					Status = "in_progress",
					Priority = "high",
					Tags = new[] { "typescript", "react", "database" },
					CreatedAt = DateTime.UtcNow,
				};
				
				await db.Create(TABLE, project);
			`,
			py: `
				from surrealdb import Surreal, RecordID
				from datetime import datetime

				# Open a connection
				with Surreal(url="wss://${instance.host}") as db:

					# Select namespace and database
					await db.use("${namespace}", "${database}")

					# Authenticate
					await db.sign_in(username="", password="")

					# Create a record
					db.create(RecordID("project", "1"), {
						"name": "SurrealDB Dashboard",
						"description": "A modern admin interface for SurrealDB",
						"status": "in_progress",
						"priority": "high",
						"tags": ["typescript", "react", "database"],
						"created_at": datetime.utcnow(),
					})

					# Select a specific record
					print(db.select(RecordID("project", "1")))
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
					"username" => "",
					"password" => "",
				]);

				// Create a record
				$db->create("project", [
					"name" => "SurrealDB Dashboard",
					"description" => "A modern admin interface for SurrealDB",
					"status" => "in_progress",
					"priority" => "high",
					"tags" => ["typescript", "react", "database"],
					"created_at" => new DateTime(),
				]);
			`,
			rust: `
				use serde::{Deserialize, Serialize};
				use surrealdb::engine::any;
				use surrealdb::opt::auth::Root;
				use tokio;
				use chrono::{DateTime, Utc};

				#[derive(Serialize, Deserialize)]
				struct Project {
					name: String,
					description: String,
					status: String,
					priority: String,
					tags: Vec<String>,
					created_at: DateTime<Utc>,
				}

				// Open a connection
				let db = any::connect("wss://${instance.host}").await?;

				// Select namespace and database
				db.use_ns("${namespace}").use_db("${database}").await?;

				// Authenticate
				db.signin(Root {
					username: "",
					password: "",
				}).await?;

				// Create a record
				let project = Project {
					name: "SurrealDB Dashboard".to_string(),
					description: "A modern admin interface for SurrealDB".to_string(),
					status: "in_progress".to_string(),
					priority: "high".to_string(),
					tags: vec!["typescript".to_string(), "react".to_string(), "database".to_string()],
					created_at: Utc::now(),
				};

				db.create("project").content(project).await?;
			`,
			java: `
				try (final Surreal db = new Surreal()) {
					
					// Open a connection
					db.connect("wss://${instance.host}");

					// Select namespace and database
					db.useNs("${namespace}").useDb("${database}");

					// Authenticate
					db.signin(new Root("", ""));

					// Create a record
					Map<String, Object> project = Map.of(
						"name", "SurrealDB Dashboard",
						"description", "A modern admin interface for SurrealDB",
						"status", "in_progress",
						"priority", "high",
						"tags", List.of("typescript", "react", "database"),
						"created_at", Instant.now()
					);

					db.create("project", project);

				}
			`,
		}),
		[instance, namespace, database],
	);

	const driver = DRIVERS.find((d) => d.id === lang);

	return (
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
				Select your desired language
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
				Install the SDK
			</Text>

			<CodeSnippet
				language={lang}
				values={installation}
				editorLanguage="sh"
			/>

			<Text
				mt="xl"
				fz="xl"
				ff="mono"
				tt="uppercase"
				fw={600}
				c="bright"
			>
				Connect to your instance
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
	);
}
