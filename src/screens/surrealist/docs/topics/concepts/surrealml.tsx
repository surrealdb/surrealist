import { Link } from "~/components/Link";
import { Article } from "~/screens/surrealist/docs/components";
import type { TopicProps } from "~/screens/surrealist/docs/types";

export function DocsConceptsSurrealML(_: TopicProps) {
	return (
		<Article title="Surreal ML">
			<div>
				<p>
					SurrealML is an engine that seeks to do one thing, and one thing well: store and
					execute trained ML models. SurrealML does not intrude on the training frameworks
					that are already out there, instead works with them to ease the storage,
					loading, and execution of models. Someone using SurrealML will be able to train
					their model in a chosen framework in Python, save the model, and load and
					execute it in either Python or Rust. You can use SurrealML within your database
					connection to store and execute trained ML models using{" "}
					<Link href="https://surrealdb.com/docs/surrealql/functions/ml/functions">
						Machine learning functions
					</Link>
					. Learn more about{" "}
					<Link href="https://surrealdb.com/docs/surrealml">
						SurrealML in the documentation
					</Link>
				</p>
			</div>
		</Article>
	);
}
