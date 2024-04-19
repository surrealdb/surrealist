import { Accordion, TextInput } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { Lister } from "../lister";
import { useStable } from "~/hooks/stable";
import { CodeInput } from "~/components/Inputs";
import { iconIndex } from "~/util/icons";

export function IndexesElement({ data, setData }: ElementProps) {

	const addIndex = useStable(() => {
		setData((d) => {
			d.indexes.push({
				name: "",
				cols: "",
				index: "",
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
			<SectionTitle icon={iconIndex}>
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
							<CodeInput
								required
								label="Indexed fields"
								value={index.cols}
								onChange={(value) =>
									setData((draft) => {
										draft.indexes[i].cols = value;
									})
								}
							/>
							<CodeInput
								label="Index type"
								placeholder="UNIQUE"
								value={index.index}
								onChange={(value: any) =>
									setData((draft) => {
										draft.indexes[i].index = value;
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