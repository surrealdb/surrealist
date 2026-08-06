import { Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconAccountPlus } from "@surrealdb/ui";
import { capitalize } from "radash";
import { useMemo, useState } from "react";
import { Form } from "~/components/Form";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { EMAIL_REGEX } from "~/util/helpers";
import { apiErrorMessage } from "../api";
import { useInvitationMutation } from "../mutations/invites";
import { useCloudRolesQuery } from "../queries/roles";
import { openMemberImportModal } from "./member-import";

export function openMemberInvitationModal(organization: CloudOrganization) {
	openModal({
		modalId: "invite-member",
		title: (
			<Group>
				<Icon path={iconAccountPlus} />
				Invite member
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
	const [error, setError] = useState("");

	const handleClose = useStable(() => {
		closeModal("invite-member");
	});

	const handleSwitchImport = useStable(() => {
		closeModal("invite-member");
		openMemberImportModal(organization);
	});

	const handleSubmit = useStable(async () => {
		try {
			setError("");

			await inviteMutation.mutateAsync({
				email,
				role,
			});

			handleClose();
		} catch (err) {
			// The modal stays open so the address can be corrected and retried
			setError(apiErrorMessage(err, "Failed to send an invitation to this member"));
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
					onClick={handleSwitchImport}
				>
					Click here to invite members in bulk
				</Text>

				{error && (
					<Text
						c="red"
						fz="sm"
					>
						{error}
					</Text>
				)}

				<Group mt="xl">
					<Button
						onClick={handleClose}
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
