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

import {
	iconAccountPlus,
	iconClose,
	iconDelete,
	iconDotsVertical,
	iconExitToAp,
	iconServerSecure,
} from "~/util/icons";

import { useMemo } from "react";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { openMemberInvitationModal } from "~/cloud/modals/member-invite";
import { openMemberRoleModal } from "~/cloud/modals/member-role";
import { useRevocationMutation } from "~/cloud/mutations/invites";
import { useRemoveMemberMutation } from "~/cloud/mutations/remove";
import { useCloudInvitationsQuery } from "~/cloud/queries/invitations";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { CloudMember } from "~/types";
import { OrganizationTabProps } from "../types";
import { useAbsoluteLocation } from "~/hooks/routing";
import { showInfo } from "~/util/helpers";
import { useQueryClient } from "@tanstack/react-query";

export function OrganizationTeamTab({ organization }: OrganizationTabProps) {
	const client = useQueryClient();
	const membersQuery = useCloudMembersQuery(organization.id);
	const invitesQuery = useCloudInvitationsQuery(organization.id);
	const revokeMutation = useRevocationMutation(organization.id);
	const removeMutation = useRemoveMemberMutation(organization.id);
	const isArchived = !!organization.archived_at;
	const userId = useCloudStore((s) => s.userId);

	const isOwner = useHasOrganizationRole(organization.id, "owner");
	const isAdmin = useHasOrganizationRole(organization.id, "admin");

	const [, navigate] = useAbsoluteLocation();

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

	const requestLeave = useConfirmation({
		title: "Leave organization",
		message: `Are you sure you want to leave ${organization.name}?`,
		confirmText: "Leave",
		onConfirm: async () => {
			navigate("/organizations");

			await removeMutation.mutateAsync(userId);

			showInfo({
				title: "Left organization",
				subtitle: "You have successfully left the organization.",
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
				description="Manage the members of your organization"
				rightSection={
					isAdmin && (
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
								const showLeave = member.role !== "owner" && isSelf;
								const showActions = member.role !== "owner" && isOwner;

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
											{showLeave ? (
												<ActionButton
													label="Leave organization"
													onClick={requestLeave}
												>
													<Icon path={iconExitToAp} />
												</ActionButton>
											) : (
												showActions && (
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
											w={0}
											pr="md"
											style={{ textWrap: "nowrap" }}
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
