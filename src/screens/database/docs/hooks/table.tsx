import { useTables } from "~/hooks/schema";
import { useInterfaceStore } from "~/stores/interface";
import { TableInfo } from "~/types";

const EXAMPLE_TABLE: TableInfo = {
	schema: {
		name: "example_table",
		drop: false,
		full: false,
		kind: {
			kind: "NORMAL",
		},
		permissions: {
			create: true,
			select: true,
			update: true,
			delete: true,
		},
	},
	fields: [
		{
			name: "field_one",
			flex: false,
			readonly: false,
			kind: "string",
			permissions: {
				create: true,
				select: true,
				update: true,
				delete: true,
			},
		},
	],
	events: [],
	indexes: [],
};

export function useDocsTable(): TableInfo {
	const active = useInterfaceStore((s) => s.docsTable);
	const tables = useTables();

	return tables.find((table) => table.schema.name === active) ?? EXAMPLE_TABLE;
}
