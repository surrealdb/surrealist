import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";
import { useActiveConnection } from "~/hooks/connection";

export function DocsTablesLiveSelecting({ language, topic }: TopicProps) {
	const { connection } = useActiveConnection();

	const schema = useSchema();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
		${connection.namespace}/${connection.database}> LIVE SELECT DIFF FROM ${topic.extra?.table?.schema?.name};
		`,
		js: `
		// The uuid of the live query will be returned
		const queryUuid = await db.live(
			"${topic.extra?.table?.schema?.name}",
			// The callback function takes an object with the 'action' and 'result' properties
			({ action, result }) => {
				// action can be: 'CREATE', 'UPDATE', 'DELETE' or 'CLOSE'
				if (action === 'CLOSE') return;

				// result contains either the entire record, or a set of JSON patches when diff mode is enabled
						processSomeLiveQueryUpdate(result);
			}
		)


		// Registers a callback function for a running live query.
		await db.listenLive(
			queryUuid,
			// The callback function takes an object with the "action" and "result" properties
			({ action, result }) => {
				// action can be: "CREATE", "UPDATE", "DELETE" or "CLOSE"
				if (action === 'CLOSE') return;

				// result contains either the entire record, or a set of JSON patches when diff mode is enabled
				processSomeLiveQueryUpdate(result);
			}
		)

		`,
		rust: `
		//Connect to a local endpoint
		DB.connect::<Ws>("127.0.0.1:8000").await?;
		//Connect to a remote endpoint
		DB.connect::<Wss>("cloud.surrealdb.com").await?;
		`,
		py: `

		`,
		go: `

		`,
		dotnet: `
		await using var liveQuery = db.ListenLive<${topic.extra?.table?.schema?.name}>(queryUuid);

		// Option 1
		// Consume the live query via an IAsyncEnumerable,
		// blocking the current thread until the query is killed.
		await foreach (var response in liveQuery)
		{
			// Either a Create, Update, Delete or Close response...
		}


		// Option 2
		// Consume the live query via an Observable.
		liveQuery
			.ToObservable()
			.Subscribe(() =>
			{
				// Either a Create, Update, Delete or Close response...
			});


		await using var liveQuery = await db.LiveQuery<${topic.extra?.table?.schema?.name}>($"LIVE SELECT * FROM type::table({table});");

// Consume the live query...
		`
		,
		java:`
		// Connect to a local endpoint
		SurrealWebSocketConnection.connect(timeout)
		`,
		php: `
		// Connect to a local endpoint
		$db = new SurrealDB();
		`,

	}), []);

	return (
		<Article title="Live Selecting">
			<div>
				<h3>Table: {topic.extra?.table?.schema?.name}</h3>
				<p>
					Create realtime query notifications for changes to selected records on <b>{topic.extra?.table?.schema?.name}</b> and see live updates  in the live message view in the console.
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Live Selecting"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
