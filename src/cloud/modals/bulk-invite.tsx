import { ActionIcon, Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { closeModal, openModal } from "@mantine/modals";
import { Icon, iconClose, iconOrganization, iconPlus, iconUpload } from "@surrealdb/ui";
import Papa from "papaparse";
import { capitalize } from "radash";
import { useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import { OpenedTextFile } from "~/adapter/base";
import { Form } from "~/components/Form";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { CloudOrganization } from "~/types";
import { EMAIL_REGEX, showErrorNotification } from "~/util/helpers";
import { useInvitationMutation } from "../mutations/invites";
import { useCloudRolesQuery } from "../queries/roles";

export function openBulkInvitationModal(organization: CloudOrganization) {
	openModal({
		modalId: "invite-member-bulk",
		title: (
			<Group>
				<Icon
					path={iconOrganization}
					size="xl"
				/>
				<PrimaryTitle>Invite multiple members</PrimaryTitle>
			</Group>
		),
		trapFocus: false,
		withCloseButton: true,
		children: <InviteBulkModal organization={organization} />,
	});
}

interface InviteBulkModalProps {
	organization: CloudOrganization;
}

interface InviteUser {
	email: string;
	role: string;
}

function InviteBulkModal({ organization }: InviteBulkModalProps) {
	const inviteMutation = useInvitationMutation(organization.id);
	const rolesQuery = useCloudRolesQuery(organization.id);

	const importedFile = useRef<OpenedTextFile | null>(null);

	const [invites, setInvites] = useInputState<InviteUser[]>([]);

	const handleClose = useStable(() => {
		closeModal("invite-member-bulk");
	});

	const handleSubmit = useStable(async () => {
		try {
			for (const invite of invites) {
				await inviteMutation.mutateAsync({
					email: invite.email,
					role: invite.role,
				});
			}
		} catch {
			showErrorNotification({
				title: "Invitations failed",
				content: "Failed to send invitations to one or more members",
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
		return (
			invites.length > 0 &&
			invites.every(
				(invite) =>
					EMAIL_REGEX.test(invite.email) &&
					invite.role &&
					roles.map((it) => it.value).includes(invite.role),
			)
		);
	}, [invites, roles]);

	const startImport = useStable(async () => {
		try {
			const [file] = await adapter.openTextFile(
				"Import query file",
				[
					{
						name: "Table data (csv)",
						extensions: ["csv"],
					},
				],
				false,
			);

			if (!file) {
				return;
			}

			importedFile.current = file;

			const result = Papa.parse<string>(file.content, {
				header: false,
				skipEmptyLines: true,
			});

			const emails = result.data.slice(1);

			if (file.name.endsWith(".csv")) {
				setInvites([...invites, ...emails.map((it) => ({ email: it, role: "member" }))]);
			}
		} finally {
			importedFile.current = null;
		}
	});

	return (
		<Form onSubmit={handleSubmit}>
			<Stack>
				<Text size="lg">
					Invite new members to your organisation by entering their email addresses below.
				</Text>

				{invites.map((invite, index) => (
					<Group key={index}>
						<TextInput
							flex={1}
							type="email"
							placeholder="user@example.com"
							value={invite.email}
							onChange={(e) =>
								setInvites(
									invites.with(index, { ...invite, email: e.target.value }),
								)
							}
						/>
						<Select
							w="25%"
							data={roles}
							value={invite.role}
							onChange={(e) =>
								setInvites(invites.with(index, { ...invite, role: e ?? "member" }))
							}
						/>
						<ActionIcon
							c="red"
							variant="transparent"
							onClick={() => setInvites(invites.filter((_, i) => i !== index))}
						>
							<Icon path={iconClose} />
						</ActionIcon>
					</Group>
				))}

				<Group mt="md">
					<Group
						gap="xs"
						c="surreal"
						style={{
							cursor: "pointer",
						}}
						onClick={() => setInvites(invites.concat({ email: "", role: "member" }))}
					>
						<Icon path={iconPlus} />
						<Text>Add member</Text>
					</Group>
					<Spacer />
					<Group
						gap="xs"
						c="surreal"
						style={{
							cursor: "pointer",
						}}
						onClick={startImport}
					>
						<Icon path={iconUpload} />
						<Text>Import from CSV</Text>
					</Group>
				</Group>

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
						Send invites
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
