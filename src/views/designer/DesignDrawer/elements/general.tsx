import { Accordion, Stack, Select, Checkbox, MultiSelect } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { iconTable } from "~/util/icons";
import { Selectable, TableType } from "~/types";
import { useTableNames } from "~/hooks/schema";

const TABLE_TYPES: Selectable<TableType>[] = [
	{ label: "Any", value: "ANY" },
	{ label: "Normal", value: "NORMAL" },
	{ label: "Relation", value: "RELATION" }
];

export function GeneralElement({ data, setData }: ElementProps) {
	const tables = useTableNames();

	return (
		<Accordion.Item value="general">
			<SectionTitle icon={iconTable}>
				General
			</SectionTitle>
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
								value={data.schema.kind.out || []}
								onChange={(value) =>
									setData((draft) => {
										draft.schema.kind.out = value;
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