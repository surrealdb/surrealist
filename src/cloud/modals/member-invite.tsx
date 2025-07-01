import { Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { capitalize } from "radash";
import { useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { showErrorNotification } from "~/util/helpers";
import { iconAccountPlus } from "~/util/icons";
import { useInvitationMutation } from "../mutations/invites";
import { useCloudRolesQuery } from "../queries/roles";

export function openMemberInvitationModal(organization: CloudOrganization) {
	openModal({
		modalId: "invite-member",
		title: (
			<Group>
				<Icon
					path={iconAccountPlus}
					size="xl"
				/>
				<PrimaryTitle>Invite member</PrimaryTitle>
			</Group>
		),
		trapFocus: false,
		withCloseButton: true,
		children: <InviteModal organization={organization} />,
	});
}

interface InviteModalProps {
	organization: CloudOrganization;
}

function InviteModal({ organization }: InviteModalProps) {
	const inviteMutation = useInvitationMutation(organization.id);
	const rolesQuery = useCloudRolesQuery(organization.id);

	const [email, setEmail] = useInputState("");
	const [role, setRole] = useState("member");

	const handleClose = useStable(() => {
		closeModal("invite-member");
	});

	const handleSubmit = useStable(async () => {
		try {
			await inviteMutation.mutateAsync({
				email,
				role,
			});
		} catch {
			showErrorNotification({
				title: "Invitation failed",
				content: "Failed to send an invitation to this user",
			});
		} finally {
			handleClose();
		}
	});

	const roles =
		rolesQuery.data?.map((role) => ({
			label: capitalize(role.name),
			value: role.name,
		})) || [];

	return (
		<Form onSubmit={handleSubmit}>
			<Stack>
				<Text size="lg">
					Invite new members to your organisation by entering their email addresses below.
				</Text>

				<TextInput
					mt="md"
					type="email"
					label="Email"
					placeholder="user@example.com"
					value={email}
					onChange={setEmail}
					autoFocus
				/>

				<Select
					data={roles}
					label="Role"
					value={role}
					onChange={setRole as any}
				/>

				<Group mt="xl">
					<Button
						onClick={handleClose}
						color="slate"
						variant="light"
						flex={1}
					>
						Close
					</Button>
					<Button
						type="submit"
						variant="gradient"
						flex={1}
						disabled={!email || !role}
						loading={inviteMutation.isPending}
					>
						Send invite
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
