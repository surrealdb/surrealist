import { Alert, Box, Button, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { useHasOrganizationRole, useOrganizationRole } from "~/cloud/hooks/role";
import { useArchiveOrganizationMutation } from "~/cloud/mutations/archive";
import { useUpdateOrganizationMutation } from "~/cloud/mutations/update";
import { Icon } from "~/components/Icon";
import { Section } from "~/components/Section";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { formatArchiveDate } from "~/util/cloud";
import { showInfo } from "~/util/helpers";
import { iconPackageClosed } from "~/util/icons";
import { OrganizationTabProps } from "../types";
import { useFeatureFlags } from "~/util/feature-flags";

export function OrganizationSettingsTab({ organization }: OrganizationTabProps) {
	const [{ organization_archiving }] = useFeatureFlags();

	const updateMutation = useUpdateOrganizationMutation(organization.id);
	const archiveMutation = useArchiveOrganizationMutation(organization.id);
	const isOwner = useHasOrganizationRole(organization.id, "owner");

	const [, navigate] = useAbsoluteLocation();
	const [name, setName] = useInputState(organization.name);

	const handleSaveName = useStable(async () => {
		await updateMutation.mutateAsync({
			name,
		});

		showInfo({
			title: "Name updated",
			subtitle: "The organization name has been updated",
		});
	});

	const requestArchive = useConfirmation({
		title: `Archive ${organization.name}`,
		message: (
			<Stack>
				<Text>
					Are you sure you want to archive this organization? Instances will continue to
					use resources and you will be billed for them.
				</Text>
				<Text c="bright">This action cannot be undone.</Text>
			</Stack>
		),
		confirmText: "Archive",
		verification: organization.name,
		verifyText: "Type the organization name to confirm",
		onConfirm: async () => {
			navigate("/organizations");

			await archiveMutation.mutateAsync();

			showInfo({
				title: "Organization archived",
				subtitle: `${organization.name} has been archived`,
			});
		},
	});

	return (
		<Stack>
			<Section
				title="Organization name"
				description="Update the name of your organization"
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
					title="Archive organization"
					description="Mark this organization as archived. This will hide it from the list of organizations."
				>
					{organization.archived_at ? (
						<Alert
							color="orange"
							title="Organization already archived"
							icon={<Icon path={iconPackageClosed} />}
						>
							<Text>
								This organization was archived on {formatArchiveDate(organization)}.
							</Text>
						</Alert>
					) : (
						<Alert
							color="orange"
							title="Archive this organization"
							icon={<Icon path={iconPackageClosed} />}
						>
							<Text>
								You can archive this organization to remove it from your overview
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
								Archive organization
							</Button>
						</Alert>
					)}
				</Section>
			)}
		</Stack>
	);
}
