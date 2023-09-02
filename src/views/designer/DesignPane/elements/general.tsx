import { Accordion, Stack, Select, Checkbox, Collapse } from "@mantine/core";
import { ElementProps, SectionTitle, TABLE_TYPES } from "../helpers";
import { QueryInput } from "../inputs";
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
					<div>
						<Checkbox label="Use table as view" checked={!!data.schema.view} onChange={updateHasView} />
						<Collapse in={!!data.schema.view}>
							<Stack pt="md">
								<QueryInput
									required
									label="View projections"
									placeholder="*"
									value={data.schema.view?.expr}
									onChangeText={(value) =>
										setData((draft) => {
											draft.schema.view!.expr = value;
										})
									}
								/>
								<QueryInput
									required
									label="View source"
									placeholder="table_name"
									value={data.schema.view?.what}
									onChangeText={(value) =>
										setData((draft) => {
											draft.schema.view!.what = value;
										})
									}
								/>
								<QueryInput
									label="View condition"
									placeholder="value > 10"
									value={data.schema.view?.cond}
									onChangeText={(value) =>
										setData((draft) => {
											draft.schema.view!.cond = value;
										})
									}
								/>
								<QueryInput
									label="View grouping"
									placeholder="field_name"
									value={data.schema.view?.group}
									onChangeText={(value) =>
										setData((draft) => {
											draft.schema.view!.group = value;
										})
									}
								/>
							</Stack>
						</Collapse>
					</div>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}