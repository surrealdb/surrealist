import { Alert, Button, Stack, Text, TextInput } from "@mantine/core";
import { OrganizationTabProps } from "../types";
import { Section } from "~/components/Section";
import { iconPackageClosed } from "~/util/icons";
import { Icon } from "~/components/Icon";

export function OrganizationSettingsTab({ organization }: OrganizationTabProps) {
	return (
		<Stack>
			<Section
				title="Organization name"
				description="Update the name of your organization"
			>
				<TextInput value={organization.name} />
			</Section>

			<Section
				title="Archive organization"
				description="Mark this organization as archived. This will hide it from the list of organizations."
			>
				<Alert
					color="red"
					title="Archive this organization"
					icon={<Icon path={iconPackageClosed} />}
				>
					<Text>
						You can archive this organization to remove it from your overview page,
						however instances will continue to use resources and you will be billed for
						them.
					</Text>
					<Button
						color="red"
						size="xs"
						mt="md"
					>
						Archive organization
					</Button>
				</Alert>
			</Section>
		</Stack>
	);
}
