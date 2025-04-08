import classes from "../style.module.scss";

import {
	ActionIcon,
	Badge,
	Box,
	Button,
	Group,
	Menu,
	Paper,
	Stack,
	Table,
	Text,
} from "@mantine/core";
import { OrganizationTabProps } from "../types";
import { Section } from "~/components/Section";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { Icon } from "~/components/Icon";
import {
	iconAccountPlus,
	iconClose,
	iconDelete,
	iconDotsVertical,
	iconServerSecure,
} from "~/util/icons";
import { useCloudStore } from "~/stores/cloud";
import { useCloudInvitationsQuery } from "~/cloud/queries/invitations";
import { useStable } from "~/hooks/stable";
import { openMemberInvitationModal } from "~/cloud/modals/member-invite";
import { ActionButton } from "~/components/ActionButton";
import { useRevocationMutation } from "~/cloud/mutations/invites";
import { useMemo } from "react";
import { useHasOrganizationWriteAccess, useOrganizationRole } from "~/cloud/hooks/role";
import { openMemberRoleModal } from "~/cloud/modals/member-role";
import { useConfirmation } from "~/providers/Confirmation";
import { CloudMember } from "~/types";
import { useRemoveMemberMutation } from "~/cloud/mutations/remove";

export function OrganizationTeamTab({ organization }: OrganizationTabProps) {
	const membersQuery = useCloudMembersQuery(organization.id);
	const invitesQuery = useCloudInvitationsQuery(organization.id);
	const revokeMutation = useRevocationMutation(organization.id);
	const removeMutation = useRemoveMemberMutation(organization.id);
	const canModify = useHasOrganizationWriteAccess(organization.id);
	const isArchived = !!organization.archived_at;
	const userId = useCloudStore((s) => s.userId);

	const handleInvite = useStable(() => {
		openMemberInvitationModal(organization);
	});

	const invitations = useMemo(() => {
		return invitesQuery.data?.filter((invite) => invite.status !== "accepted") || [];
	}, [invitesQuery.data]);

	const requestRemove = useConfirmation<CloudMember>({
		title: "Remove member",
		message: (member) => `Are you sure you want to remove ${member.name}?`,
		onConfirm: (value) => removeMutation.mutate(value.user_id),
	});

	return (
		<Stack>
			<Section
				title="Team members"
				description="Manage the members of your organization"
				rightSection={
					canModify && (
						<Button
							size="xs"
							variant="gradient"
							disabled={isArchived}
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
								const isOwner = member.role === "owner";

								return (
									<Table.Tr key={member.user_id}>
										<Table.Td c="bright">
											<Box>
												<Group gap="sm">
													<Text fw={500}>{member.name}</Text>
													<Badge
														color="slate"
														variant="light"
														size="sm"
													>
														{member.role}
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
										</Table.Td>
										<Table.Td
											w={0}
											pr="md"
											style={{ textWrap: "nowrap" }}
										>
											{!isSelf && !isOwner && canModify && (
												<Menu>
													<Menu.Target>
														<ActionIcon>
															<Icon path={iconDotsVertical} />
														</ActionIcon>
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
															onClick={() => requestRemove(member)}
														>
															Remove member
														</Menu.Item>
													</Menu.Dropdown>
												</Menu>
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
											w={0}
											pr="md"
											style={{ textWrap: "nowrap" }}
										>
											{canModify && (
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
