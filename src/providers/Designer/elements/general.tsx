import { Accordion, Checkbox, MultiSelect, Select, Stack } from "@mantine/core";
import { useTableNames } from "~/hooks/schema";
import type { Selectable, TableType } from "~/types";
import { iconCog } from "~/util/icons";
import { type ElementProps, SectionTitle } from "../helpers";

const TABLE_TYPES: Selectable<TableType>[] = [
	{ label: "Any", value: "ANY" },
	{ label: "Normal", value: "NORMAL" },
	{ label: "Relation", value: "RELATION" },
];

export function GeneralElement({ data, setData }: ElementProps) {
	const tables = useTableNames();

	return (
		<Accordion.Item value="general">
			<SectionTitle icon={iconCog}>General</SectionTitle>
			<Accordion.Panel>
				<Stack>
					<Checkbox
						label="Enforce schema"
						checked={data.schema.full}
						onChange={(e) =>
							setData((draft) => {
								draft.schema.full = e.target.checked;
							})
						}
					/>
					<Checkbox
						label="Drop writes to this table"
						checked={data.schema.drop}
						onChange={(e) =>
							setData((draft) => {
								draft.schema.drop = e.target.checked;
							})
						}
					/>
					<Select
						data={TABLE_TYPES}
						label="Table type"
						value={data.schema.kind.kind}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.kind.kind = value as TableType;
							})
						}
					/>
					{data.schema.kind.kind === "RELATION" && (
						<>
							<MultiSelect
								data={tables}
								label="Incoming tables"
								searchable
								value={data.schema.kind.in || []}
								onChange={(value) =>
									setData((draft) => {
										draft.schema.kind.in = value;
									})
								}
							/>

							<MultiSelect
								data={tables}
								label="Outgoing tables"
								searchable
								value={data.schema.kind.out || []}
								onChange={(value) =>
									setData((draft) => {
										draft.schema.kind.out = value;
									})
								}
							/>

							<Checkbox
								label="Enforce record existence"
								checked={data.schema.kind.enforced ?? false}
								onChange={(e) =>
									setData((draft) => {
										draft.schema.kind.enforced = e.target.checked;
									})
								}
							/>
						</>
					)}
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
