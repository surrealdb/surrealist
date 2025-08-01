import { Alert, Box, Button, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { hasOrganizationRole } from "~/cloud/helpers";
import { useArchiveOrganizationMutation } from "~/cloud/mutations/archive";
import { useUpdateOrganizationMutation } from "~/cloud/mutations/update";
import { Icon } from "~/components/Icon";
import { Section } from "~/components/Section";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { formatArchiveDate } from "~/util/cloud";
import { useFeatureFlags } from "~/util/feature-flags";
import { showInfo } from "~/util/helpers";
import { iconPackageClosed } from "~/util/icons";
import { OrganizationTabProps } from "../types";

export function OrganizationSettingsTab({ organization }: OrganizationTabProps) {
	const [{ organization_archiving }] = useFeatureFlags();

	const updateMutation = useUpdateOrganizationMutation(organization.id);
	const archiveMutation = useArchiveOrganizationMutation(organization.id);
	const isOwner = hasOrganizationRole(organization, "owner");

	const [, navigate] = useAbsoluteLocation();
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

	const requestArchive = useConfirmation({
		title: `Archive ${organization.name}`,
		message: (
			<Stack>
				<Text>
					Are you sure you want to archive this organisation? Instances will continue to
					use resources and you will be billed for them.
				</Text>
				<Text c="bright">This action cannot be undone.</Text>
			</Stack>
		),
		confirmText: "Archive",
		verification: organization.name,
		verifyText: "Type the organisation name to confirm",
		onConfirm: async () => {
			navigate("/organisations");

			await archiveMutation.mutateAsync();

			showInfo({
				title: "Organisation archived",
				subtitle: `${organization.name} has been archived`,
			});
		},
	});

	return (
		<Stack>
			<Section
				title="Organisation name"
				description="Update the name of your organisation"
			>
				<TextInput
					value={name}
					onChange={setName}
				/>
				<Box>
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

			{organization_archiving && isOwner && (
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
								color="slate"
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
			)}
		</Stack>
	);
}
