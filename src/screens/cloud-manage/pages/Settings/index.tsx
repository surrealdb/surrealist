import { Avatar, Box, Button, Center, Divider, Loader, Stack, Textarea, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useOrganization } from "~/hooks/cloud";
import { Section } from "../../components/Section";
import { Label } from "~/components/Label";
import { useCloudStore } from "~/stores/cloud";
import { useLayoutEffect } from "react";

export function SettingsPage() {
	const organization = useOrganization();
	const isPending = useCloudStore(s => s.authState) === "loading";

	const [name, setName] = useInputState("");
	const [desc, setDesc] = useInputState("");

	useLayoutEffect(() => {
		setName(organization?.name ?? "");
		setDesc("");
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [organization]);

	return isPending ? (
		<Center flex={1}>
			<Loader />
		</Center>
	) : (
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
			<Divider />
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