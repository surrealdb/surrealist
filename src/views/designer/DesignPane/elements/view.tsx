import { Accordion, Stack } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { QueryInput } from "../inputs";

export function ViewElement({ data, setData }: ElementProps) {
	return (
		<Accordion.Item value="view">
			<SectionTitle>
				View
			</SectionTitle>
			<Accordion.Panel>
				<Stack>
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
			</Accordion.Panel>
		</Accordion.Item>
	);
}