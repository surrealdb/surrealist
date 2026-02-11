import { Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconAccountPlus } from "@surrealdb/ui";
import { capitalize } from "radash";
import { useMemo, useState } from "react";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { EMAIL_REGEX, showErrorNotification } from "~/util/helpers";
import { useInvitationMutation } from "../mutations/invites";
import { useCloudRolesQuery } from "../queries/roles";
import { openBulkInvitationModal } from "./bulk-invite";

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

	const handleSwitchBulk = useStable(() => {
		closeModal("invite-member");
		openBulkInvitationModal(organization);
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
				content: "Failed to send an invitation to this member",
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

	const isValid = useMemo(() => {
		return EMAIL_REGEX.test(email) && !!role;
	}, [email, role]);

	return (
		<Form onSubmit={handleSubmit}>
			<Stack>
				<Text size="lg">
					Invite a new member to your organisation by entering their email address below.
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

				<Text
					fz="sm"
					c="violet"
					style={{
						cursor: "pointer",
					}}
					onClick={handleSwitchBulk}
				>
					Click here to invite multiple members
				</Text>

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
						disabled={!isValid}
						loading={inviteMutation.isPending}
					>
						Send invite
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
