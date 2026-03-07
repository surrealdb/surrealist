import { ActionIcon, Box, Button, CopyButton, Stack, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconCheck, iconCopy } from "@surrealdb/ui";
import { useUpdateOrganizationMutation } from "~/cloud/mutations/update";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { showInfo } from "~/util/helpers";
import { OrganizationTabProps } from "../types";

export function OrganizationSettingsTab({ organization }: OrganizationTabProps) {
	const updateMutation = useUpdateOrganizationMutation(organization.id);

	const [name, setName] = useInputState(organization.name);

	const handleSaveName = useStable(async () => {
		await updateMutation.mutateAsync({
			name,
		});

		showInfo({
			title: "Name updated",
			subtitle: "The organisation name has been updated",
		});
	});

	// const requestArchive = useConfirmation({
	// 	title: `Archive ${organization.name}`,
	// 	message: (
	// 		<Stack>
	// 			<Text>
	// 				Are you sure you want to archive this organisation? Instances will continue to
	// 				use resources and you will be billed for them.
	// 			</Text>
	// 			<Text c="bright">This action cannot be undone.</Text>
	// 		</Stack>
	// 	),
	// 	confirmText: "Archive",
	// 	verification: organization.name,
	// 	verifyText: "Type the organisation name to confirm",
	// 	onConfirm: async () => {
	// 		navigate("/organisations");

	// 		await archiveMutation.mutateAsync();

	// 		showInfo({
	// 			title: "Organisation archived",
	// 			subtitle: `${organization.name} has been archived`,
	// 		});
	// 	},
	// });

	return (
		<Stack>
			<Section
				title="Organisation"
				description="Manage the details of your organisation"
			>
				<TextInput
					maw={400}
					label="Organisation ID"
					description="This ID may be requested by the SurrealDB support team"
					value={organization.id}
					rightSection={
						<CopyButton value={organization.id}>
							{({ copied, copy }) => (
								<ActionIcon
									variant={copied ? "gradient" : undefined}
									aria-label="Copy organisation ID"
									radius="xs"
									size="md"
									onClick={copy}
								>
									<Icon path={copied ? iconCheck : iconCopy} />
								</ActionIcon>
							)}
						</CopyButton>
					}
					styles={{
						input: {
							fontFamily: "var(--mantine-font-family-monospace)",
						},
					}}
				/>

				<TextInput
					value={name}
					label="Name"
					description="The display name of your organisation"
					onChange={setName}
					maw={400}
				/>

				<Box mt="xl">
					<Button
						size="xs"
						variant="gradient"
						disabled={name === organization.name}
						loading={updateMutation.isPending}
						onClick={handleSaveName}
					>
						Save changes
					</Button>
				</Box>
			</Section>

			{/* {organization_archiving && isOwner && (
				<Section
					title="Archive organisation"
					description="Mark this organisation as archived. This will hide it from the list of organisations."
				>
					{organization.archived_at ? (
						<Alert
							color="orange"
							title="Organisation already archived"
							icon={<Icon path={iconPackageClosed} />}
						>
							<Text>
								This organisation was archived on {formatArchiveDate(organization)}.
							</Text>
						</Alert>
					) : (
						<Alert
							color="orange"
							title="Archive this organisation"
							icon={<Icon path={iconPackageClosed} />}
						>
							<Text>
								You can archive this organisation to remove it from your overview
								page, however instances will continue to use resources and you will
								be billed for them.
							</Text>
							<Button
								color="obsidian"
								variant="light"
								size="xs"
								mt="md"
								loading={archiveMutation.isPending}
								onClick={requestArchive}
							>
								Archive organisation
							</Button>
						</Alert>
					)}
				</Section>
			)} */}
		</Stack>
	);
}
