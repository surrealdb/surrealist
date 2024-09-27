import { Accordion, Group } from "@mantine/core";
import { Text } from "@mantine/core";
import { default as equals } from "fast-deep-equal";
import { objectify } from "radash";
import type { Updater } from "use-immer";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import type { TableInfo } from "~/types";
import { tb } from "~/util/helpers";

export interface ElementProps {
	data: TableInfo;
	setData: Updater<TableInfo>;
}

export function SectionTitle({
	children,
	icon,
}: { children: string; icon: string }) {
	return (
		<Accordion.Control>
			<Group gap="sm">
				<Icon path={icon} size={0.85} />
				<Text fw={600} size="lg">
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
}

/**
 * Build the queries to update the entire table schema
 */
export function buildDefinitionQueries({
	previous,
	current,
	useOverwrite,
}: BuildOptions) {
	const queries: string[] = [];
	const name = current.schema.name;

	const fieldIndex = objectify(current.fields, (f) => f.name);
	const indexIndex = objectify(current.indexes, (i) => i.name);
	const eventIndex = objectify(current.events, (e) => e.name);

	const isRelation = current.schema.kind.kind === "RELATION";
	const inTables = current.schema.kind.in?.map((name) => tb(name))?.join("|") ?? "";
	const outTables = current.schema.kind.out?.map((name) => tb(name))?.join("|") ?? "";

	if (!equals(previous.schema, current.schema)) {
		let query = "DEFINE TABLE";

		if (useOverwrite) {
			query += " OVERWRITE";
		}

		query += ` ${tb(current.schema.name)}`;

		if (current.schema.drop) {
			query += " DROP";
		}

		if (current.schema.full) {
			query += " SCHEMAFULL";
		} else {
			query += " SCHEMALESS";
		}

		query += ` TYPE ${current.schema.kind.kind}`;

		if (isRelation && inTables) {
			query += ` IN ${inTables}`;
		}

		if (isRelation && outTables) {
			query += ` OUT ${outTables}`;
		}

		if (isRelation && current.schema.kind.enforced) {
			query += " ENFORCED";
		}

		if (current.schema.view) {
			query += ` ${current.schema.view}`;
		}

		if (current.schema.changefeed?.expiry) {
			query += ` CHANGEFEED ${current.schema.changefeed.expiry}`;

			if (current.schema.changefeed.store_original) {
				query += " INCLUDE ORIGINAL";
			}
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
			queries.push(`REMOVE FIELD ${field.name} ON TABLE ${tb(name)}`);
		}
	}

	for (const field of current.fields) {
		let query = "DEFINE FIELD";

		if (useOverwrite) {
			query += " OVERWRITE";
		}

		query += ` ${field.name} ON TABLE ${tb(name)}`;

		if (field.flex) {
			query += " FLEXIBLE";
		}

		if (field.kind) {
			if (isRelation && field.name === "in") {
				query += ` TYPE record<${inTables}>`;
			} else if (isRelation && field.name === "out") {
				query += ` TYPE record<${outTables}>`;
			} else {
				query += ` TYPE ${field.kind}`;
			}
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
			queries.push(`REMOVE INDEX ${index.name} ON TABLE ${tb(name)}`);
		}
	}

	for (const index of current.indexes) {
		let query = "DEFINE INDEX";

		if (useOverwrite) {
			query += " OVERWRITE";
		}

		query += ` ${index.name} ON TABLE ${tb(name)} FIELDS ${index.cols} ${index.index}`;

		queries.push(query);
	}

	for (const event of previous.events) {
		if (!eventIndex[event.name]) {
			queries.push(`REMOVE EVENT ${event.name} ON TABLE ${tb(name)}`);
		}
	}

	for (const event of current.events) {
		let query = "DEFINE EVENT";

		if (useOverwrite) {
			query += " OVERWRITE";
		}

		query += ` ${event.name} ON TABLE ${tb(name)} WHEN ${event.when} THEN ${event.then.map((th) => `{${th}}`).join(", ")}`;

		queries.push(query);
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
		(info.schema.kind.kind !== "RELATION" ||
			(info.schema.kind.in && info.schema.kind.out)) &&
		info.fields.every(
			(field) =>
				field.name &&
				field.permissions.create !== "" &&
				field.permissions.select !== "" &&
				field.permissions.update !== "" &&
				field.permissions.delete !== "",
		) &&
		info.indexes.every((index) => index.name && index.cols) &&
		info.events.every(
			(event) => event.name && event.when && event.then[0].length > 0,
		);

	return !!result;
}
