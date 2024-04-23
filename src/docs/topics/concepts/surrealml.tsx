import { Article } from "~/docs/components";
import { TopicProps } from "~/docs/types";
import { useSchema } from "~/hooks/schema";

export function DocsConceptsSurrealML({ language, topic }: TopicProps) {

	const schema = useSchema();

	return (
		<Article title="Surreal ML">
			<div>
				<p>
				SurrealML is an engine that seeks to do one thing, and one thing well: store and execute trained ML models. SurrealML does not intrude on the training frameworks that are already out there, instead works with them to ease the storage, loading, and execution of models. Someone using SurrealML will be able to train their model in a chosen framework in Python, save their model, and load and execute the model in either Python or Rust.

				You can use SurrealML within your database connection to store and execute trained ML models using <a href="https://surrealdb.com/docs/surrealdb/surrealql/functions/ml">Machine learning functions</a>.


				Learn more about <a href="https://surrealdb.com/docs/surrealdb/surrealml">SurrealML in the documentation</a>


				</p>
				<p>
					{topic.extra?.table?.schema?.name}
				</p>
			</div>
		</Article>
	);
}
