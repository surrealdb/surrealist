import { Accordion, Flex, Text, TextInput } from "@mantine/core";
import { iconIndex } from "@surrealdb/ui";
import { CodeInput } from "~/components/Inputs";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { SchemaIndex } from "~/types";
import { type ElementProps, SectionTitle } from "../helpers";
import { Lister } from "../lister";

export function IndexesElement({ data, setData }: ElementProps) {
	const isLight = useIsLight();

	const initIndex = useStable(() => ({
		name: "",
		cols: "",
		index: "",
	}));

	const renderIndex = useStable((index: SchemaIndex) => (
		<Flex>
			{index.name}
			{index.cols && (
				<Text
					c={isLight ? "obsidian.5" : "obsidian.3"}
					ml="xs"
				>
					({index.cols})
				</Text>
			)}
		</Flex>
	));

	const handleChange = useStable((indexes: SchemaIndex[]) => {
		setData((draft) => {
			draft.indexes = indexes;
		});
	});

	return (
		<Accordion.Item value="indexes">
			<SectionTitle icon={iconIndex}>Indexes</SectionTitle>
			<Accordion.Panel>
				<Lister
					value={data.indexes}
					missing="No schema indexes defined yet"
					name="index"
					factory={initIndex}
					onChange={handleChange}
					display={renderIndex}
				>
					{(index, setIndex, isCreating) => (
						<>
							<TextInput
								required
								autoFocus
								label="Index name"
								placeholder="index_name"
								disabled={!isCreating}
								value={index.name}
								spellCheck={false}
								onChange={(e) =>
									setIndex((draft) => {
										draft.name = e.target.value;
									})
								}
							/>
							<CodeInput
								required
								label="Indexed fields"
								value={index.cols}
								onChange={(value) =>
									setIndex((draft) => {
										draft.cols = value;
									})
								}
							/>
							<CodeInput
								label="Index type"
								placeholder="UNIQUE"
								value={index.index}
								onChange={(value: any) =>
									setIndex((draft) => {
										draft.index = value;
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
