import { Box } from "@mantine/core";
import { useMemo } from "react";
import { Article, DocsPreview } from "~/screens/surrealist/pages/Connection/docs/components";
import type { Snippets, TopicProps } from "~/screens/surrealist/pages/Connection/docs/types";

export function DocsSdkTransactions({ language }: TopicProps) {
	const snippets = useMemo<Snippets>(
		() => ({
			cli: `
BEGIN TRANSACTION;
CREATE person SET name = "Tobie";
UPDATE person:tobie SET active = true;
COMMIT TRANSACTION;
`,
			js: `
const txn = await db.beginTransaction();

try {
	await txn.create('person').content({ name: 'Tobie' });
	await txn.merge('person:tobie', { active: true });
	await txn.commit();
} catch (err) {
	await txn.cancel();
	throw err;
}
`,
			rust: `
let txn = db.begin().await?;
txn.query("CREATE person SET name = 'Tobie'").await?;
txn.query("UPDATE person:tobie SET active = true").await?;
let db = txn.commit().await?;
`,
			py: `
txn = await db.begin_transaction()
try:
	await txn.create("person", {"name": "Tobie"})
	await txn.merge("person:tobie", {"active": True})
	await txn.commit()
except Exception:
	await txn.cancel()
`,
			go: `
tx, err := db.Begin(ctx)
if err != nil {
	panic(err)
}
defer tx.Cancel(ctx)

_, err = surrealdb.Create[Person](ctx, tx, models.Table("person"), map[string]any{"name": "Tobie"})
err = tx.Commit(ctx)
`,
			java: `
Transaction tx = db.beginTransaction();
try {
	tx.query("CREATE person SET name = 'Tobie'");
	tx.query("UPDATE person:tobie SET active = true");
	tx.commit();
} catch (Exception e) {
	tx.cancel();
	throw e;
}
`,
			csharp: `
var txn = await session.BeginTransaction();
try {
	await txn.Create("person", new { name = "Tobie" });
	await txn.Merge("person:tobie", new { active = true });
	await txn.Commit();
} catch {
	await txn.Cancel();
	throw;
}
`,
			php: `
$db->query('
	BEGIN TRANSACTION;
	CREATE person SET name = "Tobie";
	UPDATE person:tobie SET active = true;
	COMMIT TRANSACTION;
');
`,
		}),
		[],
	);

	return (
		<Article title="Transactions">
			<Box>
				<Box component="p">
					Each SurrealQL statement runs in its own transaction by default. Use manual
					transactions to group multiple operations atomically. Interactive SDK
					transactions require a WebSocket connection.
				</Box>
			</Box>
			<Box>
				<DocsPreview
					language={language}
					title="Transactions"
					values={snippets}
				/>
			</Box>
		</Article>
	);
}
