import { Stack, Text } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { escapeIdent } from "surrealdb";
import { CodePreview } from "~/components/CodePreview";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { executeQuerySingle } from "~/screens/surrealist/connection/connection";
import { showErrorNotification } from "~/util/helpers";

function header(name: string) {
	return `\n\n-- ------------------------------\n-- ${name}\n-- ------------------------------ \n\n`;
}

export async function showTableDefinitionModal(table: string) {
	try {
		const outer = await executeQuerySingle("INFO FOR DB");
		const inner = await executeQuerySingle(`INFO FOR TABLE ${escapeIdent(table)}`);

		const tableDefinition = `${outer.tables[table]};`;
		const fields = Object.values(inner.fields);
		const indexes = Object.values(inner.indexes);
		const events = Object.values(inner.events);

		const hasFields = fields.length > 0;
		const hasIndexes = indexes.length > 0;
		const hasEvents = events.length > 0;

		const fieldsDefinition = hasFields ? `${header("FIELDS")}${fields.join(";\n")};` : "";
		const indexesDefinition = hasIndexes ? `${header("INDEXES")}${indexes.join(";\n")};` : "";
		const eventsDefinition = hasEvents ? `${header("EVENTS")}${events.join(";\\n")};` : "";

		const fullDefinition =
			tableDefinition + fieldsDefinition + indexesDefinition + eventsDefinition;

		openModal({
			title: <PrimaryTitle>Table definition</PrimaryTitle>,
			size: "xl",
			withCloseButton: true,
			styles: { header: { paddingBottom: 0 } },
			children: (
				<Stack>
					<Text mt="xs">
						This is the full definition of the <strong>{table}</strong> table including
						fields, indexes, and events.
					</Text>
					<CodePreview
						mt="xl"
						withCopy
						language="surrealql"
						value={fullDefinition}
					/>
				</Stack>
			),
		});
	} catch (err: any) {
		console.warn("Failed to generate definition", err);

		showErrorNotification({
			title: "Failed to generate table definition",
			content: err,
		});
	}
}
