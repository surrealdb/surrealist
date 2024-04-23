import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsGlobalSchemaTables({ language, topic }: TopicProps) {
	const schema = useSchema();
	const { connection } = useActiveConnection();
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
		CREATE townsperson, cat, dog SET created_at = time::now(), name = "Just a " + meta::tb(id);

		// Select all records from the townsperson table
		SELECT * FROM townsperson;
		`,
			js: `
		// Create a record with a random ID
		const [person] = await db.create<Person>('person');


		// Create a record with a specific ID
		await db.create('person:tobie', {
			name: 'Tobie',
			settings: {
				active: true,
				marketing: true,
			},
		});

		// Select all records from the person table
		await db.select<Person>('person');

		// Select a specific record from the person table
		await db.select<Person>('person:tobie');

		`,
			rust: `
		// Create a record with a random ID
		let people: Vec<Person> = db.create("person").await?;


		// Create a record with a specific ID
		let record: Option<Record> = db
			.create(("person", "tobie"))
			.content(Person {
				name: "Tobie",
				settings: {
					active: true,
					marketing: true,
			},
			}).await?;


		// Select all records from a table
			let people: Vec<Person> = db.select("person").await?;

		// Select a specific record from a table
		let person: Option<Person> = db.select(("person", "h5wxrf2ewk8xjxosxtyc")).await?;

			`,
			py: `
		# Create a record with a random ID
		person = await db.create('person')


		# Create a record with a specific ID
		record = await db.create('person:tobie', {
			'name': 'Tobie',
			'settings': {
				'active': true,
				'marketing': true,
			},
		})

		# Select all records from a table
		people = await db.select('person')

		# Select a specific record from a table
		person = await db.select('person:h5wxrf2ewk8xjxosxtyc')
		`,
			go: `
		// Create a record with a random ID
		db.Create("person", map[string]interface{}{})


		// Create a record with a specific ID w/ a map
		db.Create("person:tobie", map[string]interface{}{
			"name": "Tobie",
			"settings": map[string]bool{
				"active":    true,
				"marketing": true,
			},
		})


		// Create a record with a specific ID w/ a struct
		type Person struct {
			Name     string
			Surname  string
			Settings settings
		}

		type settings struct {
			Active    bool
			Marketing bool
		}

		data := Person{
			Name: "Hugh",
			Settings: settings{
				Active:    true,
				Marketing: true,
			},
		}


		db.Create("person:hugh", data)
		`,
			csharp: `
				// Create a record with a random ID
		var person = await db.Create<Person>("person");

		// Create a record with a random ID & specific fields
		var person = await db.Create("person", new Person { Name = "Tobie" });

		// Create a record with a specific ID
		var personToCreate = new Person
		{
			Id = ("person", "tobie"),
			Name = "Tobie",
			Settings = new Settings
			{
				Active = true,
				Marketing = true,
			},
		};
		var result = await db.Create(personToCreate);

		// Select all records from a table
		await db.Select<Person>("person");

		// Select a specific record from a table
		await db.Select<Person>(("person", "h5wxrf2ewk8xjxosxtyc"););

		// Select a specific record from a table, given a non-string id
		await db.Select<Person>(("person", new Guid("8424486b-85b3-4448-ac8d-5d51083391c7")));
		`,
			java: `
		driver.update(thing, data)
		`,
			php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,
		}),
		[]
	);

	return (
		<Article title="Tables">
			<div>
				<p>
					When interacting with SurrealDB, you will be working with
					tables. Tables are the primary storage in a database. They
					contain the data that you want to store and retrieve. You
					can create, read, update, and delete data from tables. You
					can also create indexes on tables to speed up queries.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Tables"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
