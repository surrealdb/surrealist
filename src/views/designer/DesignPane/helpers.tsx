import { TableDefinition } from "~/types";
import { default as equals } from "fast-deep-equal";
import { objectify } from "radash";
import { Accordion } from "@mantine/core";
import { Text } from "@mantine/core";
import { Updater } from "use-immer";

export interface ElementProps {
	data: TableDefinition;
	setData: Updater<TableDefinition>;
}

export const TABLE_TYPES = [
	{ label: "Schemaless", value: "schemaless" },
	{ label: "Schemafull", value: "schemafull" },
];

export function SectionTitle({ children }: { children: string }) {
	return (
		<Accordion.Control>
			<Text weight={700} size="lg">
				{children}
			</Text>
		</Accordion.Control>
	);
}

function buildPermission(type: string, value: string) {
	return ` FOR ${type} ${value}`;
}

/**
 * Build the queries to update the entire table schema
 *
 * @param previous Previous state
 * @param current Current state
 * @returns The queries to execute
 */
export function buildDefinitionQueries(previous: TableDefinition, current: TableDefinition) {
	const queries: string[] = [];
	const name = current.schema.name;

	const fieldIndex = objectify(current.fields, (f) => f.name);
	const indexIndex = objectify(current.indexes, (i) => i.name);
	const eventIndex = objectify(current.events, (e) => e.name);

	if (!equals(previous.schema, current.schema)) {
		let query = `DEFINE TABLE ${current.schema.name}`;

		if (current.schema.drop) {
			query += " DROP";
		}

		if (current.schema.schemafull) {
			query += " SCHEMAFULL";
		} else {
			query += " SCHEMALESS";
		}

		if (current.schema.view) {
			query += ` AS SELECT ${current.schema.view.expr} FROM ${current.schema.view.what}`;

			if (current.schema.view.cond) {
				query += ` WHERE ${current.schema.view.cond}`;
			}

			if (current.schema.view.group) {
				query += ` GROUP BY ${current.schema.view.group}`;
			}
		}

		if (current.schema.changefeed) {
			query += ` CHANGEFEED ${current.schema.changetime}`;
		}

		query += " PERMISSIONS";
		query += buildPermission("create", current.schema.permissions.create);
		query += buildPermission("select", current.schema.permissions.select);
		query += buildPermission("update", current.schema.permissions.update);
		query += buildPermission("delete", current.schema.permissions.delete);

		queries.push(query);
	}

	for (const field of previous.fields) {
		if (!fieldIndex[field.name]) {
			queries.push(`REMOVE FIELD ${field.name} ON TABLE ${name}`);
		}
	}

	for (const field of current.fields) {
		let query = `DEFINE FIELD ${field.name} ON TABLE ${name}`;

		if (field.flexible) {
			query += " FLEXIBLE";
		}

		if (field.kind) {
			query += ` TYPE ${field.kind}`;
		}

		if (field.value) {
			query += ` VALUE ${field.value}`;
		}

		if (field.assert) {
			query += ` ASSERT ${field.assert}`;
		}

		if (field.default) {
			query += ` DEFAULT ${field.default}`;
		}

		query += " PERMISSIONS";
		query += buildPermission("create", field.permissions.create);
		query += buildPermission("select", field.permissions.select);
		query += buildPermission("update", field.permissions.update);
		query += buildPermission("delete", field.permissions.delete);

		queries.push(query);
	}

	for (const index of previous.indexes) {
		if (!indexIndex[index.name]) {
			queries.push(`REMOVE INDEX ${index.name} ON TABLE ${name}`);
		}
	}

	for (const index of current.indexes) {
		let query = `DEFINE INDEX ${index.name} ON TABLE ${name} FIELDS ${index.fields}`;

		switch (index.kind) {
			case "unique": {
				query += " UNIQUE";
				break;
			}
			case "search": {
				query += ` SEARCH ANALYZER ${index.search}`;
				break;
			}
			case "vector": {
				query += ` MTREE DIMENSION ${index.vector}`;
				break;
			}
		}

		queries.push(query);
	}

	for (const event of previous.events) {
		if (!eventIndex[event.name]) {
			queries.push(`REMOVE EVENT ${event.name} ON TABLE ${name}`);
		}
	}

	for (const event of current.events) {
		const query = `DEFINE EVENT ${event.name} ON TABLE ${name} WHEN ${event.cond} THEN (${event.then})`;

		queries.push(query);
	}

	return queries.join(";\n");
}

/**
 * Returns whether the schema is valid
 *
 * @param schema The schema to check
 * @returns Whether the schema is valid
 */
export function isSchemaValid(schema: TableDefinition): boolean {
	const result =
		schema.schema.name &&
		schema.schema.permissions.create &&
		schema.schema.permissions.select &&
		schema.schema.permissions.update &&
		schema.schema.permissions.delete &&
		(!schema.schema.changefeed || schema.schema.changetime) &&
		schema.fields.every(
			(field) =>
				field.name &&
				field.permissions.create &&
				field.permissions.select &&
				field.permissions.update &&
				field.permissions.delete
		) &&
		schema.indexes.every(
			(index) =>
				index.name &&
				index.fields &&
				index.kind &&
				(index.kind != 'search' || index.search) &&
				(index.kind != 'vector' || index.vector)
		) &&
		schema.events.every(
			(event) =>
				event.name &&
				event.cond &&
				event.then
		);

	return !!result;
}
