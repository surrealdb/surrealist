import { Box, Button, Group, Paper, Stack, Text, TextInput, ThemeIcon } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	SectionTitle as Heading,
	Icon,
	iconWarning,
	pictoSettingsGradient,
	useStable,
} from "@surrealdb/ui";
import { useUpdateContextMutation } from "~/cloud/mutations/spectron";
import { Section } from "~/components/Section";
import { useDeleteContext } from "~/hooks/cloud";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { ContextHero } from "../../../components/ContextHero";
import type { ContextViewProps } from "../../../types";
import classes from "../style.module.scss";

export function GeneralTab({ context }: ContextViewProps) {
	const organization = context.organization_id;
	const updateContextMutation = useUpdateContextMutation(organization);

	const [name, setName] = useInputState(context.name);

	const handleSave = useStable(async () => {
		try {
			const res = await updateContextMutation.mutateAsync({
				id: context.id,
				body: {
					name,
				},
			});

			if (res) {
				showInfo({
					title: "Context updated",
					subtitle: "Your context details have been saved",
				});
			} else {
				showErrorNotification({
					title: "Failed to update context",
					content: "Something went wrong while updating the context",
				});
			}
		} catch (err) {
			showErrorNotification({
				title: "Failed to update context",
				content: err instanceof Error ? err.message : String(err),
			});
		}
	});

	const requestDelete = useDeleteContext(context, `/o/${organization}/overview`);

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Settings"
				title="General"
				description="The basic details for this context, plus the destructive actions. Update the display name, or copy the identifiers your tooling needs."
				art={pictoSettingsGradient}
			/>

			{/* CONTEXT DETAILS */}
			<Section
				title="Context details"
				description="Manage the details of your context"
			>
				<TextInput
					value={name}
					label="Name"
					description="The display name of your context"
					onChange={setName}
					maw={400}
				/>

				<Box mt="sm">
					<Button
						size="xs"
						variant="gradient"
						disabled={name === context.name || name.trim().length === 0}
						loading={updateContextMutation.isPending}
						onClick={handleSave}
					>
						Save changes
					</Button>
				</Box>
			</Section>

			{/* DANGER ZONE */}
			<Box>
				<Heading
					kicker="Danger zone"
					order={2}
					mb="sm"
					kickerProps={{ c: "red" }}
					titleProps={{ fz: 22, mt: 4 }}
				>
					Irreversible actions
				</Heading>
				<Paper
					p="lg"
					radius="md"
					className={classes.dangerPane}
				>
					<Group
						justify="space-between"
						align="flex-start"
						gap="md"
						wrap="wrap"
					>
						<Group
							gap="sm"
							align="flex-start"
							wrap="nowrap"
							maw={560}
						>
							<ThemeIcon
								size={36}
								radius="md"
								variant="light"
								color="red"
							>
								<Icon path={iconWarning} />
							</ThemeIcon>
							<Box>
								<Text
									fw={600}
									c="bright"
								>
									Delete context
								</Text>
								<Text
									mt={4}
									className="selectable"
								>
									Permanently remove this context along with every memory,
									knowledge source, and API key connected to it. This cannot be
									undone.
								</Text>
								<Button
									mt="md"
									color="red"
									onClick={() => requestDelete()}
								>
									Delete context
								</Button>
							</Box>
						</Group>
					</Group>
				</Paper>
			</Box>
		</Stack>
	);
}
