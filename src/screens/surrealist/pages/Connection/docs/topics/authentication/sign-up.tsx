import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import { useDocsConnection } from "~/screens/surrealist/pages/Connection/docs/hooks/connection";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsAuthSignUp({ language }: TopicProps) {
	const { esc_namespace, esc_database } = useDocsConnection();

	const snippets = useMemo<Snippets>(
		() => ({
			js: `
// Sign up a new record user via DEFINE ACCESS
const tokens = await db.signup({
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
use surrealdb::opt::auth::Record;

let jwt = db.signup(Record {
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
await db.signup({
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
token, err := db.SignUp(ctx, &surrealdb.Auth{
	Namespace: ${esc_namespace},
	Database:  ${esc_database},
	Access:    "account",
	Email:     "user@example.com",
	Password:  "secret",
})
`,
			csharp: `
var tokens = await db.SignUp(new AuthParams
{
	Namespace = ${esc_namespace},
	Database = ${esc_database},
	Access = "account",
	Email = "user@example.com",
	Password = "secret",
});
`,
			java: `
import com.surrealdb.signin.RecordCredential;
import com.surrealdb.signin.Token;

Token token = db.signup(new RecordCredential(
	${esc_namespace},
	${esc_database},
	"account",
	Map.of("email", "user@example.com", "password", "secret")
));
`,
			php: `
$jwt = $db->signup([
	"namespace" => ${esc_namespace},
	"database" => ${esc_database},
	"access" => "account",
	"email" => "user@example.com",
	"pass" => "secret",
]);
`,
		}),
		[esc_namespace, esc_database],
	);

	return (
		<Article title="Sign up">
			<Box>
				<Box component="p">
					Record access methods let anonymous users create accounts in your database. The
					SIGNUP clause in a <code>DEFINE ACCESS TYPE RECORD</code> statement defines
					which variables are required - typically <code>email</code> and{" "}
					<code>pass</code>.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Sign up"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
