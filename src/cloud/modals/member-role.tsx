import { Button, Group, Select, Stack, Text } from "@mantine/core";
import { closeModal, openModal } from "@mantine/modals";
import { capitalize } from "radash";
import { useState } from "react";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useStable } from "~/hooks/stable";
import { CloudMember, CloudOrganization } from "~/types";
import { showError } from "~/util/helpers";
import { iconTag } from "~/util/icons";
import { useUpdateRoleMutation } from "../mutations/role";
import { useCloudRolesQuery } from "../queries/roles";
import { LearnMore } from "~/components/LearnMore";

export function openMemberRoleModal(organization: CloudOrganization, member: CloudMember) {
	openModal({
		modalId: "member-role",
		title: (
			<Group>
				<Icon
					path={iconTag}
					size="xl"
				/>
				<PrimaryTitle>Update role</PrimaryTitle>
			</Group>
		),
		trapFocus: false,
		withCloseButton: true,
		children: (
			<RoleModal
				organization={organization}
				member={member}
			/>
		),
	});
}

interface RoleModalProps {
	organization: CloudOrganization;
	member: CloudMember;
}

function RoleModal({ organization, member }: RoleModalProps) {
	const roleMutation = useUpdateRoleMutation(organization.id);
	const rolesQuery = useCloudRolesQuery(organization.id);

	const [role, setRole] = useState(member.role);

	const handleClose = useStable(() => {
		closeModal("member-role");
	});

	const handleSubmit = useStable(async () => {
		try {
			await roleMutation.mutateAsync({
				userId: member.user_id,
				role,
			});
		} catch {
			showError({
				title: "Role change failed",
				subtitle: "Failed to update member role",
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
				<Text size="lg">Choose a new role for {member.name}</Text>

				<Select
					data={roles}
					label="Role"
					value={role}
					onChange={setRole as any}
				/>

				<LearnMore href="https://surrealdb.com/docs/cloud/advanced-topics/manage-organisation-permissions">
					Learn more about roles and permissions
				</LearnMore>

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
						loading={roleMutation.isPending}
					>
						Update role
					</Button>
				</Group>
			</Stack>
		</Form>
	);
}
