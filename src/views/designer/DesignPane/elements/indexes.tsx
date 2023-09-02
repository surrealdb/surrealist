import { Accordion, TextInput, Checkbox } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { QueryInput } from "../inputs";
import { Lister } from "../lister";
import { useStable } from "~/hooks/stable";

export function IndexesElement({ data, setData }: ElementProps) {

	const addIndex = useStable(() => {
		setData((d) => {
			d.indexes.push({
				name: "",
				fields: "",
				unique: false,
			});
		});
	});

	const removeIndex = useStable((index: number) => {
		setData((d) => {
			d.indexes.splice(index, 1);
		});
	});

	return (
		<Accordion.Item value="indexes">
			<SectionTitle>
				Indexes
			</SectionTitle>
			<Accordion.Panel>
				<Lister
					value={data.indexes}
					missing="No schema indexes defined yet"
					name="index"
					onCreate={addIndex}
					onRemove={removeIndex}
				>
					{(index, i) => (
						<>
							<TextInput
								required
								autoFocus
								label="Index name"
								placeholder="index_name"
								value={index.name}
								onChange={(e) =>
									setData((draft) => {
										draft.indexes[i].name = e.target.value;
									})
								}
							/>
							<QueryInput
								label="Indexed fields"
								value={index.fields}
								onChangeText={(value) =>
									setData((draft) => {
										draft.indexes[i].fields = value;
									})
								}
							/>
							<Checkbox
								label="Unique index"
								checked={index.unique}
								onChange={(e) =>
									setData((draft) => {
										draft.indexes[i].unique = e.target.checked;
									})
								}
							/>
						</>
					)}
				</Lister>
			</Accordion.Panel>
		</Accordion.Item>
	);
}