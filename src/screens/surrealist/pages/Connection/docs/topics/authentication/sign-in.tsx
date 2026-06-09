import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsConnection } from "~/screens/surrealist/pages/Connection/docs/hooks/connection";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsAuthSignIn({ language }: TopicProps) {
	const { esc_endpoint, esc_namespace, esc_database } = useDocsConnection();

	const descriptions = {
		cli: `The surreal sql command accepts --user and --pass flags to authenticate as a system user when opening a session.`,
		_: `Authenticate as a system user (root, namespace, or database) or as a record user via a DEFINE ACCESS method.`,
	};

	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
surreal sql -e ${esc_endpoint} --ns ${esc_namespace} --db ${esc_database} --user root --pass secret
`,
			js: `
// Authenticate as a root user
const tokens = await db.signin({
	username: 'root',
	password: 'secret',
});

// Authenticate as a namespace user
await db.signin({
	namespace: ${esc_namespace},
	username: 'admin',
	password: 'secret',
});

// Authenticate as a record user via DEFINE ACCESS
await db.signin({
	namespace: ${esc_namespace},
	database: ${esc_database},
	access: 'account',
	variables: {
		email: 'user@example.com',
		pass: 'secret',
	},
});
`,
			rust: `
use surrealdb::opt::auth::{Database, Namespace, Record, Root};

// Sign in as a root user
db.signin(Root {
	username: "root".into(),
	password: "secret".into(),
}).await?;

// Sign in as a record user via DEFINE ACCESS
db.signin(Record {
	namespace: ${esc_namespace},
	database: ${esc_database},
	access: "account".into(),
	params: Credentials {
		email: "user@example.com".into(),
		pass: "secret".into(),
	},
}).await?;
`,
			py: `
# Authenticate as a root user
await db.signin({"username": "root", "password": "secret"})

# Authenticate as a record user via DEFINE ACCESS
await db.signin({
	"namespace": ${esc_namespace},
	"database": ${esc_database},
	"access": "account",
	"variables": {
		"email": "user@example.com",
		"password": "secret",
	},
})
`,
			go: `
// Sign in as a root user
token, err := db.SignIn(ctx, &surrealdb.Auth{
	Username: "root",
	Password: "secret",
})

// Sign in as a record user via DEFINE ACCESS
token, err = db.SignIn(ctx, &surrealdb.Auth{
	Namespace: ${esc_namespace},
	Database:  ${esc_database},
	Access:    "account",
	Email:     "user@example.com",
	Password:  "secret",
})
`,
			csharp: `
// Sign in as a root user
var tokens = await db.SignIn(new RootAuth
{
	Username = "root",
	Password = "secret",
});

// Sign in as a record user via DEFINE ACCESS
var jwt = await db.SignIn(new AuthParams
{
	Namespace = ${esc_namespace},
	Database = ${esc_database},
	Access = "account",
	Email = "user@example.com",
	Password = "secret",
});
`,
			java: `
import com.surrealdb.signin.DatabaseCredential;
import com.surrealdb.signin.NamespaceCredential;
import com.surrealdb.signin.RecordCredential;
import com.surrealdb.signin.RootCredential;

// Sign in as a root user
db.signin(new RootCredential("root", "secret"));

// Sign in as a record user via DEFINE ACCESS
db.signin(new RecordCredential(
	${esc_namespace},
	${esc_database},
	"account",
	Map.of("email", "user@example.com", "password", "secret")
));
`,
			php: `
// Sign in as a root user
$db->signin(["username" => "root", "password" => "secret"]);

// Sign in as a record user via DEFINE ACCESS
$db->signin([
	"namespace" => ${esc_namespace},
	"database" => ${esc_database},
	"access" => "account",
	"email" => "user@example.com",
	"pass" => "secret",
]);
`,
		}),
		[esc_endpoint, esc_namespace, esc_database],
	);

	return (
		<Article title="Sign in">
			<Box>
				<Box component="p">
					{descriptions[language as keyof typeof descriptions] ?? descriptions._}
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Sign in"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
