import { Accordion, Stack, TextInput } from "@mantine/core";
import { iconClock } from "~/util/icons";
import { type ElementProps, SectionTitle } from "../helpers";

export function ChangefeedElement({ data, setData }: ElementProps) {
	return (
		<Accordion.Item value="changefeed">
			<SectionTitle icon={iconClock}>Changefeed</SectionTitle>
			<Accordion.Panel>
				<Stack>
					<TextInput
						label="Expiry duration"
						placeholder="7d"
						spellCheck={false}
						value={data.schema.changefeed?.expiry || ""}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.changefeed = {
									expiry: value.currentTarget.value,
									store_original:
										data.schema.changefeed
											?.store_original || false,
								};
							})
						}
					/>
					{/* <Checkbox
						label="Store original"
						placeholder="7d"
						checked={data.schema.changefeed?.store_original || false}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.changefeed = {
									expiry: data.schema.changefeed?.expiry || '7d',
									store_original: value.currentTarget.checked,
								};
							})
						}
					/> */}
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}
