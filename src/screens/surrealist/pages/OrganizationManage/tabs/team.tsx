import { Avatar, Badge, Box, Button, Group, Menu, Paper, Stack, Table, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
	hasOrganizationRoles,
	isOrganisationRestricted,
	normalizeRole,
	ORG_ROLES_ADMIN,
	ORG_ROLES_OWNER,
} from "~/cloud/helpers";
import { openMemberInvitationModal } from "~/cloud/modals/member-invite";
import { openMemberRoleModal } from "~/cloud/modals/member-role";
import { useRevocationMutation } from "~/cloud/mutations/invites";
import { useRemoveMemberMutation } from "~/cloud/mutations/remove";
import { useCloudInvitationsQuery } from "~/cloud/queries/invitations";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Section } from "~/components/Section";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { CloudMember } from "~/types";
import { showInfo } from "~/util/helpers";
import {
	iconAccountPlus,
	iconClose,
	iconDelete,
	iconDotsVertical,
	iconExitToAp,
	iconServerSecure,
} from "~/util/icons";
import classes from "../style.module.scss";
import { OrganizationTabProps } from "../types";

export function OrganizationTeamTab({ organization }: OrganizationTabProps) {
	const client = useQueryClient();
	const membersQuery = useCloudMembersQuery(organization.id);
	const invitesQuery = useCloudInvitationsQuery(organization.id);
	const revokeMutation = useRevocationMutation(organization.id);
	const removeMutation = useRemoveMemberMutation(organization.id);
	const userId = useCloudStore((s) => s.userId);

	const isRestricted = isOrganisationRestricted(organization);
	const isOwner = hasOrganizationRoles(organization, ORG_ROLES_OWNER);
	const isAdmin = hasOrganizationRoles(organization, ORG_ROLES_ADMIN);

	const [, navigate] = useAbsoluteLocation();

	const handleInvite = useStable(() => {
		openMemberInvitationModal(organization);
	});

	const sanitizeRole = useStable((role: string) => {
		return role.replace("restricted_", "");
	});

	const invitations = useMemo(() => {
		return invitesQuery.data?.filter((invite) => invite.status !== "accepted") || [];
	}, [invitesQuery.data]);

	const requestRemove = useConfirmation<CloudMember>({
		title: "Remove member",
		skippable: true,
		message: (member) => `Are you sure you want to remove ${member.name}?`,
		onConfirm: (value) => removeMutation.mutate(value.user_id),
	});

	const requestLeave = useConfirmation({
		title: "Leave organisation",
		message: `Are you sure you want to leave ${organization.name}?`,
		confirmText: "Leave",
		skippable: true,
		onConfirm: async () => {
			navigate("/organisations");

			await removeMutation.mutateAsync(userId);

			showInfo({
				title: "Left organisation",
				subtitle: "You have successfully left the organisation.",
			});

			client.invalidateQueries({
				queryKey: ["cloud", "organizations"],
			});
		},
	});

	return (
		<Stack>
			<Section
				title="Team members"
				description="Manage the members of your organisation"
				rightSection={
					isAdmin && (
						<Button
							size="xs"
							variant="gradient"
							disabled={isRestricted}
							leftSection={<Icon path={iconAccountPlus} />}
							onClick={handleInvite}
						>
							Invite member
						</Button>
					)
				}
			>
				<Paper p="md">
					<Table className={classes.table}>
						<Table.Tbody>
							{membersQuery.data?.map((member) => {
								const isSelf = member.user_id === userId;
								const showLeave = normalizeRole(member.role) !== "owner" && isSelf;
								const showOpts = normalizeRole(member.role) !== "owner" && isOwner;

								return (
									<Table.Tr key={member.user_id}>
										<Table.Td c="bright">
											<Group>
												<Avatar
													src={member.profile_picture}
													name={member.name}
													radius="sm"
												/>
												<Box>
													<Group gap="sm">
														<Text fw={500}>{member.name}</Text>
														<Badge
															color="slate"
															variant="light"
															size="sm"
														>
															{sanitizeRole(member.role)}
														</Badge>
														{isSelf && (
															<Badge
																color="violet"
																variant="light"
																size="sm"
															>
																You
															</Badge>
														)}
													</Group>

													<Text
														fz="sm"
														opacity={0.6}
													>
														{member.username}
													</Text>
												</Box>
											</Group>
										</Table.Td>
										<Table.Td
											w={1}
											pr="md"
											style={{ whiteSpace: "nowrap" }}
										>
											{showLeave ? (
												<ActionButton
													label="Leave organisation"
													onClick={requestLeave}
												>
													<Icon path={iconExitToAp} />
												</ActionButton>
											) : (
												showOpts && (
													<Menu>
														<Menu.Target>
															<ActionButton label="Member actions">
																<Icon path={iconDotsVertical} />
															</ActionButton>
														</Menu.Target>
														<Menu.Dropdown>
															<Menu.Item
																leftSection={
																	<Icon path={iconServerSecure} />
																}
																onClick={() =>
																	openMemberRoleModal(
																		organization,
																		member,
																	)
																}
															>
																Update role
															</Menu.Item>
															<Menu.Divider />
															<Menu.Item
																c="red"
																leftSection={
																	<Icon
																		path={iconDelete}
																		c="red"
																	/>
																}
																onClick={() =>
																	requestRemove(member)
																}
															>
																Remove member
															</Menu.Item>
														</Menu.Dropdown>
													</Menu>
												)
											)}
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				</Paper>
			</Section>
			{!!invitations.length && (
				<Section
					title={
						<Group gap="sm">
							Pending invitations
							<Badge
								color="slate"
								variant="light"
								size="sm"
							>
								{invitations.length}
							</Badge>
						</Group>
					}
					description="Sent invitations awaiting acceptance"
				>
					<Paper p="md">
						<Table className={classes.table}>
							<Table.Tbody>
								{invitations.map((invite) => (
									<Table.Tr key={invite.code}>
										<Table.Td c="bright">
											<Group gap="sm">
												<Text fw={500}>{invite.email}</Text>
												<Badge
													color="slate"
													variant="light"
													size="sm"
												>
													{invite.role}
												</Badge>
											</Group>
										</Table.Td>
										<Table.Td
											w={1}
											pr="md"
											style={{ whiteSpace: "nowrap" }}
										>
											{isAdmin && (
												<ActionButton
													label="Revoke invitation"
													onClick={() =>
														revokeMutation.mutate(invite.code)
													}
												>
													<Icon path={iconClose} />
												</ActionButton>
											)}
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					</Paper>
				</Section>
			)}
		</Stack>
	);
}
