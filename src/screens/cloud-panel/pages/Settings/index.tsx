import { Box, Center, Loader, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useLayoutEffect } from "react";
import { Label } from "~/components/Label";
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
		<Stack
			w="100%"
			maw={900}
			mx="auto"
		>
			<Section
				title="Settings"
				description="Manage your organization details and information"
				withMaxWidth
			>
				<Box>
					<Label>Name</Label>
					<Text>The display name of your organization</Text>
					<TextInput
						mt="xs"
						value={name}
						onChange={setName}
						disabled
					/>
					<Text
						c="red"
						fz="xs"
						mt="xs"
					>
						You can't change the name of your personal organization
					</Text>
				</Box>

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
