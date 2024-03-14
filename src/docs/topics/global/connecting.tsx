import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/docs/components";
import { Snippets, TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";

export function DocsGlobalConnecting({ language, topic }: TopicProps) {

	const schema = useSchema();

	const snippets = useMemo<Snippets>(() => ({
		cli: `
			$ surreal sql --endpoint ${topic.extra?.connectionUri} --namespace ${topic.extra?.namespace} --database ${topic.extra?.database}
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
		<Article title="Connecting">
			<div>
				<p>
					Lorem ipsum dolor sit amet, consectetur adipisicing elit. Est ipsam magnam laborum accusamus non! Culpa sint, placeat quis, repellat sapiente nesciunt dolores facere qui dignissimos itaque accusamus a error quos.
				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
			<Box>
				<DocsPreview
					language={language}
					title="Opening a connection"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}