import { Box, Button, Group, Paper, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { useDeleteContextMutation } from "~/cloud/mutations/spectron";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useAbsoluteLocation } from "~/hooks/routing";
import type { ContextViewProps } from "../../types";

export default function SettingsView({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const [, navigate] = useAbsoluteLocation();
	const deleteContextMutation = useDeleteContextMutation(organization);
	const [confirmName, setConfirmName] = useState("");

	const canDelete = confirmName === context.name;

	const handleDelete = async () => {
		await deleteContextMutation.mutateAsync(context.id);

		const backPath = organization ? `/o/${organization}/overview` : "/overview";
		navigate(backPath);
	};

	return (
		<>
			<PrimaryTitle fz={32}>Settings</PrimaryTitle>

			<Section title="General">
				<Stack gap="md">
					<TextInput
						label="Name"
						value={context.name}
						readOnly
						disabled
					/>
					<TextInput
						label="Region"
						value={context.region}
						readOnly
						disabled
					/>
					<TextInput
						label="Host"
						value={context.host}
						readOnly
						disabled
					/>
				</Stack>
			</Section>

			<Section title="Danger zone">
				<Paper
					p="lg"
					style={{
						borderColor: "var(--mantine-color-red-9)",
						borderWidth: 1,
						borderStyle: "solid",
					}}
				>
					<Stack gap="lg">
						<Group
							justify="space-between"
							align="flex-start"
						>
							<Box>
								<Text
									fw={500}
									c="bright"
								>
									Delete context
								</Text>
								<Text className="selectable">
									Permanently delete this context and all associated data.
								</Text>
							</Box>
						</Group>
						<TextInput
							label={`Type "${context.name}" to confirm`}
							placeholder={context.name}
							value={confirmName}
							onChange={(e) => setConfirmName(e.currentTarget.value)}
						/>
						<Group justify="flex-end">
							<Button
								color="red"
								size="xs"
								disabled={!canDelete}
								loading={deleteContextMutation.isPending}
								onClick={handleDelete}
							>
								Delete context
							</Button>
						</Group>
					</Stack>
				</Paper>
			</Section>
		</>
	);
}
