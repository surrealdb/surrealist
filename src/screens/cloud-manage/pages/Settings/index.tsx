import { Center, Loader, Stack, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect } from "react";
import { useOrganization } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";
import { Section } from "../../components/Section";

export function SettingsPage() {
	const organization = useOrganization();
	const isPending = useCloudStore((s) => s.authState) === "loading";

	const [name, setName] = useInputState("");
	const [desc, setDesc] = useInputState("");

	useLayoutEffect(() => {
		setName(organization?.name ?? "");
		setDesc("");
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
					disabled
				/>

				{/* <Textarea
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
				</Box> */}
			</Section>
			{/* <Divider />
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
			</Section> */}
		</Stack>
	);
}
