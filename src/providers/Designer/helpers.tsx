import { Accordion, Group, Text } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { default as equals } from "fast-deep-equal";
import { objectify } from "radash";
import { escapeIdent } from "surrealdb";
import type { Updater } from "use-immer";
import { adapter } from "~/adapter";
import type { SchemaEvent, SchemaField, SchemaIndex, SchemaTable, TableInfo } from "~/types";

export interface ElementProps {
	data: TableInfo;
	setData: Updater<TableInfo>;
}

export function SectionTitle({ children, icon }: { children: string; icon: string }) {
	return (
		<Accordion.Control>
			<Group gap="sm">
				<Icon
					path={icon}
					opacity={0.6}
				/>
				<Text
					fw={600}
					size="lg"
				>
					{children}
				</Text>
			</Group>
		</Accordion.Control>
	);
}

function buildPermission(type: string, value: boolean | string) {
	return ` FOR ${type} ${value === true ? "FULL" : value === false ? "NONE" : `WHERE ${value}`}`;
}

export interface BuildOptions {
	previous: TableInfo;
	current: TableInfo;
	useOverwrite?: boolean;
	useAlter?: boolean;
}

interface RelationContext {
	isRelation: boolean;
	inTables: string;
	outTables: string;
}

function getRelationContext(schema: SchemaTable): RelationContext {
	const isRelation = schema.kind.kind === "RELATION";

	return {
		isRelation,
		inTables: schema.kind.in?.map((name) => escapeIdent(name))?.join("|") ?? "",
		outTables: schema.kind.out?.map((name) => escapeIdent(name))?.join("|") ?? "",
	};
}

function getFieldKind(field: SchemaField, context: RelationContext) {
	if (context.isRelation && field.name === "in") {
		return `record<${context.inTables}>`;
	}

	if (context.isRelation && field.name === "out") {
		return `record<${context.outTables}>`;
	}

	return field.kind;
}

function buildTablePermissionClauses(permissions: SchemaTable["permissions"]) {
	let query = "";
	query += buildPermission("create", permissions.create);
	query += buildPermission("select", permissions.select);
	query += buildPermission("update", permissions.update);
	query += buildPermission("delete", permissions.delete);

	return query;
}

function buildTablePermissions(permissions: SchemaTable["permissions"]) {
	return ` PERMISSIONS${buildTablePermissionClauses(permissions)}`;
}

function buildFieldPermissionClauses(permissions: SchemaField["permissions"]) {
	let query = "";
	query += buildPermission("create", permissions.create);
	query += buildPermission("select", permissions.select);
	query += buildPermission("update", permissions.update);

	return query;
}

function buildFieldPermissions(permissions: SchemaField["permissions"]) {
	return ` PERMISSIONS${buildFieldPermissionClauses(permissions)}`;
}

function requiresTableOverwrite(previous: SchemaTable, current: SchemaTable) {
	return (
		previous.drop !== current.drop ||
		previous.view !== current.view ||
		!equals(previous.kind, current.kind)
	);
}

function buildDefineTableQuery(current: SchemaTable, useOverwrite?: boolean) {
	const context = getRelationContext(current);
	let query = "DEFINE TABLE";

	if (useOverwrite) {
		query += " OVERWRITE";
	}

	query += ` ${escapeIdent(current.name)}`;

	if (current.drop) {
		query += " DROP";
	}

	if (current.full) {
		query += " SCHEMAFULL";
	} else {
		query += " SCHEMALESS";
	}

	query += ` TYPE ${current.kind.kind}`;

	if (context.isRelation && context.inTables) {
		query += ` IN ${context.inTables}`;
	}

	if (context.isRelation && context.outTables) {
		query += ` OUT ${context.outTables}`;
	}

	if (context.isRelation && current.kind.enforced) {
		query += " ENFORCED";
	}

	if (current.view) {
		query += ` ${current.view}`;
	}

	if (current.changefeed?.expiry) {
		query += ` CHANGEFEED ${current.changefeed.expiry}`;

		if (current.changefeed.store_original) {
			query += " INCLUDE ORIGINAL";
		}
	}

	query += buildTablePermissions(current.permissions);

	return query;
}

function buildAlterTableQuery(previous: SchemaTable, current: SchemaTable) {
	const parts: string[] = [];

	if (previous.full !== current.full) {
		parts.push(current.full ? "SCHEMAFULL" : "SCHEMALESS");
	}

	if (!equals(previous.permissions, current.permissions)) {
		parts.push(`PERMISSIONS${buildTablePermissionClauses(current.permissions)}`);
	}

	if (!equals(previous.changefeed, current.changefeed)) {
		if (!current.changefeed?.expiry) {
			parts.push("DROP CHANGEFEED");
		} else {
			let changefeed = `CHANGEFEED ${current.changefeed.expiry}`;

			if (current.changefeed.store_original) {
				changefeed += " INCLUDE ORIGINAL";
			}

			parts.push(changefeed);
		}
	}

	if (parts.length === 0) {
		return null;
	}

	return `ALTER TABLE ${escapeIdent(current.name)} ${parts.join(" ")}`;
}

function buildDefineFieldQuery(
	field: SchemaField,
	table: string,
	context: RelationContext,
	useOverwrite?: boolean,
) {
	let query = "DEFINE FIELD";

	if (useOverwrite) {
		query += " OVERWRITE";
	}

	query += ` ${field.name} ON TABLE ${escapeIdent(table)}`;

	const kind = getFieldKind(field, context);

	if (kind) {
		query += ` TYPE ${kind}`;
	}

	if (field.flex) {
		query += " FLEXIBLE";
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

	if (field.readonly) {
		query += " READONLY";
	}

	query += buildFieldPermissions(field.permissions);

	return query;
}

function buildAlterFieldQuery(
	previous: SchemaField,
	current: SchemaField,
	table: string,
	context: RelationContext,
) {
	const parts: string[] = [];
	const previousKind = getFieldKind(previous, context);
	const currentKind = getFieldKind(current, context);

	if (previousKind !== currentKind) {
		if (currentKind) {
			parts.push(`TYPE ${currentKind}`);
		} else {
			parts.push("DROP TYPE");
		}
	}

	if (previous.flex !== current.flex) {
		parts.push(current.flex ? "FLEXIBLE" : "DROP FLEXIBLE");
	}

	if (previous.readonly !== current.readonly) {
		parts.push(current.readonly ? "READONLY" : "DROP READONLY");
	}

	if (previous.value !== current.value) {
		if (current.value) {
			parts.push(`VALUE ${current.value}`);
		} else {
			parts.push("DROP VALUE");
		}
	}

	if (previous.assert !== current.assert) {
		if (current.assert) {
			parts.push(`ASSERT ${current.assert}`);
		} else {
			parts.push("DROP ASSERT");
		}
	}

	if (previous.default !== current.default) {
		if (current.default) {
			parts.push(`DEFAULT ${current.default}`);
		} else {
			parts.push("DROP DEFAULT");
		}
	}

	if (!equals(previous.permissions, current.permissions)) {
		parts.push(`PERMISSIONS${buildFieldPermissionClauses(current.permissions)}`);
	}

	if (parts.length === 0) {
		return null;
	}

	return `ALTER FIELD ${current.name} ON TABLE ${escapeIdent(table)} ${parts.join(" ")}`;
}

function buildDefineIndexQuery(index: SchemaIndex, table: string, useOverwrite?: boolean) {
	let query = "DEFINE INDEX";

	if (useOverwrite) {
		query += " OVERWRITE";
	}

	query += ` ${escapeIdent(index.name)} ON TABLE ${escapeIdent(table)} FIELDS ${index.cols} ${index.index}`;

	return query;
}

function buildDefineEventQuery(event: SchemaEvent, table: string, useOverwrite?: boolean) {
	let query = "DEFINE EVENT";

	if (useOverwrite) {
		query += " OVERWRITE";
	}

	query += ` ${escapeIdent(event.name)} ON TABLE ${escapeIdent(table)} WHEN ${event.when} THEN ${event.then.map((th) => `{${th}}`).join(", ")}`;

	return query;
}

function buildAlterEventQuery(previous: SchemaEvent, current: SchemaEvent, table: string) {
	const parts: string[] = [];

	if (previous.when !== current.when) {
		parts.push(`WHEN ${current.when}`);
	}

	if (!equals(previous.then, current.then)) {
		parts.push(`THEN ${current.then.map((th) => `{${th}}`).join(", ")}`);
	}

	if (parts.length === 0) {
		return null;
	}

	return `ALTER EVENT ${escapeIdent(current.name)} ON TABLE ${escapeIdent(table)} ${parts.join(" ")}`;
}

/**
 * Build the queries to update the entire table schema
 */
export function buildDefinitionQueries({
	previous,
	current,
	useOverwrite,
	useAlter,
}: BuildOptions) {
	const queries: string[] = [];
	const name = current.schema.name;
	const context = getRelationContext(current.schema);

	const previousFieldIndex = objectify(previous.fields, (field) => field.name);
	const fieldIndex = objectify(current.fields, (field) => field.name);
	const previousIndexIndex = objectify(previous.indexes, (index) => index.name);
	const indexIndex = objectify(current.indexes, (index) => index.name);
	const previousEventIndex = objectify(previous.events, (event) => event.name);
	const eventIndex = objectify(current.events, (event) => event.name);

	if (!equals(previous.schema, current.schema)) {
		if (useAlter && !requiresTableOverwrite(previous.schema, current.schema)) {
			const query = buildAlterTableQuery(previous.schema, current.schema);

			if (query) {
				queries.push(query);
			}
		} else {
			queries.push(buildDefineTableQuery(current.schema, useOverwrite));
		}
	}

	for (const field of previous.fields) {
		if (!fieldIndex[field.name]) {
			queries.push(`REMOVE FIELD ${field.name} ON TABLE ${escapeIdent(name)}`);
		}
	}

	for (const field of current.fields) {
		const previousField = previousFieldIndex[field.name];

		if (!previousField) {
			queries.push(buildDefineFieldQuery(field, name, context));
			continue;
		}

		if (equals(previousField, field)) {
			continue;
		}

		if (useAlter) {
			const query = buildAlterFieldQuery(previousField, field, name, context);

			if (query) {
				queries.push(query);
			}
		} else {
			queries.push(buildDefineFieldQuery(field, name, context, useOverwrite));
		}
	}

	for (const index of previous.indexes) {
		if (!indexIndex[index.name]) {
			queries.push(`REMOVE INDEX ${escapeIdent(index.name)} ON TABLE ${escapeIdent(name)}`);
		}
	}

	for (const index of current.indexes) {
		const previousIndex = previousIndexIndex[index.name];

		if (!previousIndex) {
			queries.push(buildDefineIndexQuery(index, name));
			continue;
		}

		if (equals(previousIndex, index)) {
			continue;
		}

		if (useAlter) {
			queries.push(`REMOVE INDEX ${escapeIdent(index.name)} ON TABLE ${escapeIdent(name)}`);
			queries.push(buildDefineIndexQuery(index, name));
		} else {
			queries.push(buildDefineIndexQuery(index, name, useOverwrite));
		}
	}

	for (const event of previous.events) {
		if (!eventIndex[event.name]) {
			queries.push(`REMOVE EVENT ${escapeIdent(event.name)} ON TABLE ${escapeIdent(name)}`);
		}
	}

	for (const event of current.events) {
		const previousEvent = previousEventIndex[event.name];

		if (!previousEvent) {
			queries.push(buildDefineEventQuery(event, name));
			continue;
		}

		if (equals(previousEvent, event)) {
			continue;
		}

		if (useAlter) {
			const query = buildAlterEventQuery(previousEvent, event, name);

			if (query) {
				queries.push(query);
			}
		} else {
			queries.push(buildDefineEventQuery(event, name, useOverwrite));
		}
	}

	adapter.log("Designer", "Applying queries:");

	for (const query of queries) adapter.log("Designer", `- ${query}`);

	return ["BEGIN TRANSACTION", ...queries, "COMMIT TRANSACTION"].join(";\n");
}

/**
 * Returns whether the schema is valid
 *
 * @param info The schema to check
 * @returns Whether the schema is valid
 */
export function isSchemaValid(info: TableInfo): boolean {
	const result =
		info.schema.name &&
		info.schema.permissions.create !== "" &&
		info.schema.permissions.select !== "" &&
		info.schema.permissions.update !== "" &&
		info.schema.permissions.delete !== "" &&
		(info.schema.kind.kind !== "RELATION" || (info.schema.kind.in && info.schema.kind.out)) &&
		info.fields.every(
			(field) =>
				field.name &&
				field.permissions.create !== "" &&
				field.permissions.select !== "" &&
				field.permissions.update !== "",
		) &&
		info.indexes.every((index) => index.name && index.cols) &&
		info.events.every((event) => event.name && event.when && event.then[0].length > 0);

	return !!result;
}
