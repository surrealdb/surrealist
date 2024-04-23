import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";

export function DocsGlobalHandlingErrors({ language, topic }: TopicProps) {

	const schema = useSchema();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
			surreal sql --endpoint ${topic.extra?.connectionUri} --namespace ${topic.extra?.namespace} --database ${topic.extra?.database}
		`,
		js: `
			// some comment
			import { db } from './database';

			// more code
			db.select("${schema?.tables?.[0]?.schema?.name}").then((rows) => {
				console.log(rows);
			});
		`,
	}), []);

	return (
		<Article title="Handling errors">
			<div>
				<p>
					Handling errors is an important part of any application. Here's how to handle errors in SurrealDB.
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Handling errors"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
