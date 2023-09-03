import { Accordion, TextInput, Select } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { QueryInput } from "../inputs";
import { Lister } from "../lister";
import { useStable } from "~/hooks/stable";
import { INDEX_TYPES } from "~/constants";
import { IndexKind } from "~/types";

export function IndexesElement({ data, setData }: ElementProps) {

	const addIndex = useStable(() => {
		setData((d) => {
			d.indexes.push({
				name: "",
				fields: "",
				kind: 'normal',
				search: "",
				vector: "",
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
								required
								label="Indexed fields"
								value={index.fields}
								onChangeText={(value) =>
									setData((draft) => {
										draft.indexes[i].fields = value;
									})
								}
							/>
							<Select
								label="Index type"
								value={index.kind}
								data={INDEX_TYPES}
								onChange={(value: IndexKind) =>
									setData((draft) => {
										draft.indexes[i].kind = value;
									})
								}
							/>
							{index.kind === 'search' && (
								<QueryInput
									required
									label="Search expression"
									value={index.search}
									placeholder="ascii BM25 HIGHLIGHTS"
									onChangeText={(value) =>
										setData((draft) => {
											draft.indexes[i].search = value;
										})
									}
								/>
							)}
							{index.kind === 'vector' && (
								<QueryInput
									required
									label="Vector expression"
									value={index.vector}
									placeholder="..."
									onChangeText={(value) =>
										setData((draft) => {
											draft.indexes[i].vector = value;
										})
									}
								/>
							)}
						</>
					)}
				</Lister>
			</Accordion.Panel>
		</Accordion.Item>
	);
}