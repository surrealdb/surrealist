import { TableDefinition, TableSchema } from "~/typings";
import { default as equals } from 'fast-deep-equal';
import { objectify } from "radash";

export const QUERY_STYLE = {
	input: {
		fontFamily: 'JetBrains Mono'
	}
}

export const TABLE_TYPES = [
	{ label: 'Schemaless', value: 'schemaless' },
	{ label: 'Schemafull', value: 'schemafull' }
];

function buildPermission(type: string, value: string) {
	return ` FOR ${type} ${(value == 'FULL' || value == 'NONE') ? value : `WHERE ${value})`}`;
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

	const fieldIndex = objectify(current.fields, f => f.name);
	const indexIndex = objectify(current.indexes, i => i.name);
	const eventIndex = objectify(current.events, e => e.name);

	if (!equals(previous.schema, current.schema)) {
		let query = `DEFINE TABLE ${current.schema.name}`;

		if (current.schema.drop) {
			query += ' DROP';
		}

		if (current.schema.schemafull) {
			query += ' SCHEMAFULL';
		} else {
			query += ' SCHEMALESS';
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

		query += ' PERMISSIONS';
		query += buildPermission('create', current.schema.permissions.create);
		query += buildPermission('select', current.schema.permissions.select);
		query += buildPermission('update', current.schema.permissions.update);
		query += buildPermission('delete', current.schema.permissions.delete);

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
			query += ' FLEXIBLE';
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

		query += ' PERMISSIONS';
		query += buildPermission('create', field.permissions.create);
		query += buildPermission('select', field.permissions.select);
		query += buildPermission('update', field.permissions.update);
		query += buildPermission('delete', field.permissions.delete);

		queries.push(query);
	}

	for (const index of previous.indexes) {
		if (!indexIndex[index.name]) {
			queries.push(`REMOVE INDEX ${index.name} ON TABLE ${name}`);
		}
	}

	for (const index of current.indexes) {
		let query = `DEFINE INDEX ${index.name} ON TABLE ${name} FIELDS ${index.fields}`;

		if (index.unique) {
			query += ' UNIQUE';
		}

		queries.push(query);
	}

	for (const event of previous.events) {
		if (!eventIndex[event.name]) {
			queries.push(`REMOVE EVENT ${event.name} ON TABLE ${name}`);
		}
	}

	for (const event of current.events) {
		let query = `DEFINE EVENT ${event.name} ON TABLE ${name} WHEN ${event.cond} THEN (${event.then})`;

		queries.push(query);
	}

	return queries.join(';\n');
}