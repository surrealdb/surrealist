import { Avatar, Box, Button, Stack, Textarea, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useOrganization } from "~/hooks/cloud";
import { Section } from "../../components/Section";
import { Label } from "~/components/Label";

export function SettingsPage() {
	const organization = useOrganization();

	const [name, setName] = useInputState(organization?.name ?? "");
	const [desc, setDesc] = useInputState("");

	return (
		<Stack>
			<Section
				title="Organization details"
				description="Manage your organization profile and information"
				withMaxWidth
			>
				<TextInput
					label="Name"
					value={name}
					onChange={setName}
				/>

				<Textarea
					label="Description"
					value={desc}
					onChange={setDesc}
					autosize
					minRows={3}
				/>

				<Box>
					<Label>
						Organization logo
					</Label>

					<Avatar
						name={organization?.name}
						radius="sm"
						size="xl"
						mt={2}
					/>
				</Box>
			</Section>
			<Section
				title="Danger zone"
			>
				<Box>
					<Button
						color="red"
						size="xs"
						variant="light"
					>
						Request organization deletion
					</Button>
				</Box>
			</Section>
		</Stack>
	);
}