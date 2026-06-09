import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsConnection } from "~/screens/surrealist/pages/Connection/docs/hooks/connection";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsGlobalInit({ language }: TopicProps) {
	const { esc_endpoint, esc_endpoint_java, esc_namespace, esc_database } = useDocsConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
# Start a local SurrealDB instance
surreal start --user root --pass secret memory

# Open an interactive SQL shell
surreal sql --endpoint ${esc_endpoint} --namespace ${esc_namespace} --database ${esc_database}
`,
			js: `
import { Surreal } from 'surrealdb';

// Create a new Surreal instance
const db = new Surreal();

// Connect to the database
await db.connect(${esc_endpoint}, {
	namespace: ${esc_namespace},
	database: ${esc_database},
});
`,
			rust: `
use surrealdb::engine::any;
use surrealdb::Surreal;

// Create a new Surreal instance
let db = Surreal::init();

// Connect to the database
db.connect(${esc_endpoint}).await?;

// Specify namespace and database
db.use_ns(${esc_namespace}).use_db(${esc_database}).await?;
`,
			py: `
from surrealdb import AsyncSurreal

# Connect using an async context manager
async with AsyncSurreal(${esc_endpoint}) as db:
	await db.use(${esc_namespace}, ${esc_database})
	# Sign in and run queries...
`,
			go: `
import (
	"context"
	"github.com/surrealdb/surrealdb.go"
)

ctx := context.Background()
db := surrealdb.New(${esc_endpoint})
`,
			csharp: `
using SurrealDb.Net;

// Connect to a local or remote endpoint
var db = new SurrealDbClient(${esc_endpoint});
`,
			java: `
import com.surrealdb.Surreal;

try (Surreal db = new Surreal()) {
	db.connect(${esc_endpoint_java});
	db.useNs(${esc_namespace}).useDb(${esc_database});
}
`,
			php: `
use Surreal\\Surreal;

$db = new Surreal();
`,
		}),
		[esc_endpoint, esc_endpoint_java, esc_namespace, esc_database],
	);

	return (
		<Article title="Initialising">
			<Box>
				<Box component="p">
					To initialise a connection to SurrealDB, create a new client instance and
					connect to your endpoint. Once connected, select a namespace and database before
					running queries or authenticating.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Initialise"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
