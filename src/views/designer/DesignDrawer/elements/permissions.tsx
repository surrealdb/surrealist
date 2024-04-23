import { Accordion, Stack } from "@mantine/core";
import { ElementProps, SectionTitle } from "../helpers";
import { PermissionInput } from "~/components/Inputs";
import { iconKey } from "~/util/icons";

export function PermissionsElement({ data, setData }: ElementProps) {
	return (
		<Accordion.Item value="permissions">
			<SectionTitle icon={iconKey}>
				Permissions
			</SectionTitle>
			<Accordion.Panel>
				<Stack>
					<PermissionInput
						label="Create access"
						value={data.schema.permissions.create}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.permissions.create = value;
							})
						}
					/>
					<PermissionInput
						label="Select access"
						value={data.schema.permissions.select}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.permissions.select = value;
							})
						}
					/>
					<PermissionInput
						label="Update access"
						value={data.schema.permissions.update}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.permissions.update = value;
							})
						}
					/>
					<PermissionInput
						label="Delete access"
						value={data.schema.permissions.delete}
						onChange={(value) =>
							setData((draft) => {
								draft.schema.permissions.delete = value;
							})
						}
					/>
				</Stack>
			</Accordion.Panel>
		</Accordion.Item>
	);
}