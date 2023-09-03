import { Accordion, Stack, Select, Checkbox } from "@mantine/core";
import { ElementProps, SectionTitle, TABLE_TYPES } from "../helpers";
import { ChangeEvent } from "react";
import { useStable } from "~/hooks/stable";

export function GeneralElement({ data, setData }: ElementProps) {

	const updateHasView = useStable((e: ChangeEvent<HTMLInputElement>) => {
		const newIsView = e.target.checked;

		if (newIsView) {
			setData((draft) => {
				draft.schema.view = {
					expr: "",
					what: "",
					cond: "",
					group: "",
				};
			});
		} else {
			setData((draft) => {
				draft.schema.view = null;
			});
		}
	});
	
	return (
		<Accordion.Item value="general">
			<SectionTitle>
				General
			</SectionTitle>
			<Accordion.Panel>
				<Stack>
					<Select
						data={TABLE_TYPES}
						label="Table Type"
						value={data.schema.schemafull ? "schemafull" : "schemaless"}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.schemafull = value === "schemafull";
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
					<Checkbox
						label="Use table as view"
						checked={!!data.schema.view}
						onChange={updateHasView}
					/>
					<Checkbox
						label="Record changefeed"
						checked={!!data.schema.changefeed}
						onChange={(e) =>
							setData((draft) => {
								draft.schema.changefeed = e.target.checked;
							})
						}
					/>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}