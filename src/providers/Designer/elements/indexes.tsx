import { Accordion, Flex, Text, TextInput } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { Lister } from "../lister";
import { useStable } from "~/hooks/stable";
import { CodeInput } from "~/components/Inputs";
import { iconIndex } from "~/util/icons";
import { SchemaIndex } from "~/types";
import { useIsLight } from "~/hooks/theme";

export function IndexesElement({ data, setData }: ElementProps) {
	const isLight = useIsLight();

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

	const renderIndex = useStable((index: SchemaIndex) => (
		<Flex>
			{index.name}
			{index.cols && (
				<Text c={isLight ? "slate.5" : "slate.3"} ml="xs">
					({index.cols})
				</Text>
			)}
		</Flex>
	));

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
					display={renderIndex}
				>
					{(index, i) => (
						<>
							<TextInput
								required
								autoFocus
								label="Index name"
								placeholder="index_name"
								value={index.name}
								spellCheck={false}
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