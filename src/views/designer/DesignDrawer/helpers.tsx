import { TableInfo } from "~/types";
import { default as equals } from "fast-deep-equal";
import { objectify } from "radash";
import { Accordion, Group } from "@mantine/core";
import { Text } from "@mantine/core";
import { Updater } from "use-immer";
import { printLog, tb } from "~/util/helpers";
import { Icon } from "~/components/Icon";

const printMsg = (...args: any[]) => printLog("Designer", "#0cd6e8", ...args);

export interface ElementProps {
	data: TableInfo;
	setData: Updater<TableInfo>;
}

export function SectionTitle({ children, icon }: { children: string, icon: string }) {
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
	return ` FOR ${type} ${value === true ? 'FULL' : value === false ? 'NONE' : value}`;
}

/**
 * Build the queries to update the entire table schema
 *
 * @param previous Previous state
 * @param current Current state
 * @returns The queries to execute
 */
export function buildDefinitionQueries(previous: TableInfo, current: TableInfo) {
	const queries: string[] = [];
	const name = current.schema.name;

	const fieldIndex = objectify(current.fields, (f) => f.name);
	const indexIndex = objectify(current.indexes, (i) => i.name);
	const eventIndex = objectify(current.events, (e) => e.name);

	if (!equals(previous.schema, current.schema)) {
		const tableType = current.schema.kind.kind;

		let query = `DEFINE TABLE ${tb(current.schema.name)}`;

		if (current.schema.drop) {
			query += " DROP";
		}

		if (current.schema.full) {
			query += " SCHEMAFULL";
		} else {
			query += " SCHEMALESS";
		}

		query += ` TYPE ${tableType}`;

		if (tableType === "RELATION" && current.schema.kind.in) {
			query += ` IN ${current.schema.kind.in.map(name => tb(name)).join(", ")}`;
		}

		if (tableType === "RELATION" && current.schema.kind.out) {
			query += ` OUT ${current.schema.kind.out.map(name => tb(name)).join(", ")}`;
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
		let query = `DEFINE FIELD ${field.name} ON TABLE ${tb(name)}`;

		if (field.flex) {
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
			queries.push(`REMOVE INDEX ${index.name} ON TABLE ${tb(name)}`);
		}
	}

	for (const index of current.indexes) {
		queries.push(`DEFINE INDEX ${index.name} ON TABLE ${tb(name)} FIELDS ${index.cols} ${index.index}`);
	}

	for (const event of previous.events) {
		if (!eventIndex[event.name]) {
			queries.push(`REMOVE EVENT ${event.name} ON TABLE ${tb(name)}`);
		}
	}

	for (const event of current.events) {
		const query = `DEFINE EVENT ${event.name} ON TABLE ${tb(name)} WHEN ${event.when} THEN ${event.then.map(th => `{${th}}`).join(", ")}`;

		queries.push(query);
	}

	printMsg("Applying queries:");

	for (const query of queries) printMsg(query);

	return queries.join(";\n");
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
				field.permissions.update !== "" &&
				field.permissions.delete !== ""
		) &&
		info.indexes.every(
			(index) =>
				index.name &&
				index.cols
		) &&
		info.events.every(
			(event) =>
				event.name &&
				event.when &&
				event.then[0].length > 0
		);

	return !!result;
}
