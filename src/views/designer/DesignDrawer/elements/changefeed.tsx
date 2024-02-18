import { Accordion, TextInput } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";

export function ChangefeedElement({ data, setData }: ElementProps) {
	return (
		<Accordion.Item value="changefeed">
			<SectionTitle>
				Changefeed
			</SectionTitle>
			<Accordion.Panel>
				<TextInput
					required
					label="Expiration duration"
					placeholder="7d"
					value={data.schema.changetime}
					onChange={(value) =>
						setData((draft) => {
							draft.schema.changetime = value.currentTarget.value;
						})
					}
				/>
			</Accordion.Panel>
		</Accordion.Item>
	);
}