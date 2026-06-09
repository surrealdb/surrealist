import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsConnection } from "~/screens/surrealist/pages/Connection/docs/hooks/connection";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsGlobalConnecting({ language }: TopicProps) {
	const { esc_endpoint, esc_endpoint_java, esc_namespace, esc_database } = useDocsConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
surreal sql --endpoint ${esc_endpoint} --namespace ${esc_namespace} --database ${esc_database} --user root --pass secret
`,
			js: `
import { Surreal } from 'surrealdb';

const db = new Surreal();

// Connect with namespace, database, and authentication
await db.connect(${esc_endpoint}, {
	namespace: ${esc_namespace},
	database: ${esc_database},
	authentication: {
		username: 'root',
		password: 'secret',
	},
});
`,
			rust: `
use surrealdb::engine::any;
use surrealdb::opt::auth::Root;
use surrealdb::Surreal;

let db = Surreal::init();
db.connect(${esc_endpoint}).await?;
db.use_ns(${esc_namespace}).use_db(${esc_database}).await?;

// Authenticate as a system user
db.signin(Root {
	username: "root".into(),
	password: "secret".into(),
}).await?;
`,
			py: `
from surrealdb import AsyncSurreal

async with AsyncSurreal(${esc_endpoint}) as db:
	await db.use(${esc_namespace}, ${esc_database})
	await db.signin({"username": "root", "password": "secret"})
`,
			go: `
import (
	"context"
	"github.com/surrealdb/surrealdb.go"
)

ctx := context.Background()
db := surrealdb.New(${esc_endpoint})

_, err := db.SignIn(ctx, &surrealdb.Auth{
	Username: "root",
	Password: "secret",
})
if err != nil {
	panic(err)
}

err = db.Use(ctx, ${esc_namespace}, ${esc_database})
`,
			csharp: `
using SurrealDb.Net;
using SurrealDb.Net.Models.Auth;

var db = new SurrealDbClient(${esc_endpoint});

await db.SignIn(new RootAuth
{
	Username = "root",
	Password = "secret",
});

await db.Use(${esc_namespace}, ${esc_database});
`,
			java: `
import com.surrealdb.Surreal;
import com.surrealdb.signin.RootCredential;

try (Surreal db = new Surreal()) {
	db.connect(${esc_endpoint_java});
	db.useNs(${esc_namespace}).useDb(${esc_database});
	db.signin(new RootCredential("root", "secret"));
}
`,
			php: `
$db->connect(${esc_endpoint}, [
	"namespace" => ${esc_namespace},
	"database" => ${esc_database},
]);

$db->signin([
	"username" => "root",
	"password" => "secret",
]);
`,
		}),
		[esc_endpoint, esc_endpoint_java, esc_namespace, esc_database],
	);

	return (
		<Article title="Connecting">
			<Box>
				<Box component="p">
					Establish a connection to your SurrealDB instance, select the namespace and
					database to use, and authenticate. Passing authentication details to{" "}
					<code>.connect()</code> in the JavaScript SDK enables automatic reconnection.
				</Box>
			</Box>
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
