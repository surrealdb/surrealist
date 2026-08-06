import {
	Avatar,
	Badge,
	Box,
	Button,
	Group,
	Menu,
	Pagination,
	Paper,
	SegmentedControl,
	Stack,
	Table,
	Text,
	TextInput,
} from "@mantine/core";
import {
	Icon,
	iconAccountPlus,
	iconClose,
	iconDelete,
	iconDotsVertical,
	iconDownload,
	iconExitToAp,
	iconSearch,
	iconServerSecure,
	iconUpload,
	Spacer,
} from "@surrealdb/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { adapter } from "~/adapter";
import {
	hasOrganizationRoles,
	isOrganisationRestricted,
	normalizeRole,
	ORG_ROLES_ADMIN,
	ORG_ROLES_OWNER,
} from "~/cloud/helpers";
import { openMemberImportModal } from "~/cloud/modals/member-import";
import { openMemberInvitationModal } from "~/cloud/modals/member-invite";
import { openMemberRoleModal } from "~/cloud/modals/member-role";
import { useRevocationMutation } from "~/cloud/mutations/invites";
import { useRemoveMemberMutation } from "~/cloud/mutations/remove";
import { useCloudInvitationsQuery } from "~/cloud/queries/invitations";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { ActionButton } from "~/components/ActionButton";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { CSV_FILTER } from "~/constants";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloud } from "~/providers/Cloud";
import { useConfirmation } from "~/providers/Confirmation";
import { CloudMember, CloudOrganization } from "~/types";
import { showInfo } from "~/util/helpers";
import classes from "../style.module.scss";
import { OrganizationTabProps } from "../types";

const PAGE_SIZE = 10;

type TeamView = "members" | "pending";

/** Quote a CSV cell, since member names may well contain a comma. */
function escapeCell(value: string) {
	return /[",\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/**
 * Write the organisation's members as a CSV file, using the same columns the
 * member import reads so an exported team can be moved to another organisation.
 *
 * @param members The members to export
 * @returns The CSV file contents
 */
function membersToCsv(members: CloudMember[]) {
	const rows = members.map((member) =>
		[member.username, normalizeRole(member.role), member.name].map(escapeCell).join(","),
	);

	return ["email,role,name", ...rows].join("\n");
}

/** Turn an organisation name into a filename-safe stem. */
function slugify(organization: CloudOrganization) {
	return organization.name.trim().replaceAll(/\s+/g, "-").toLowerCase() || "organisation";
}

export function OrganizationTeamTab({ organization }: OrganizationTabProps) {
	const client = useQueryClient();
	const membersQuery = useCloudMembersQuery(organization.id);
	const invitesQuery = useCloudInvitationsQuery(organization.id);
	const revokeMutation = useRevocationMutation(organization.id);
	const removeMutation = useRemoveMemberMutation(organization.id);
	const { userId } = useCloud();

	const isRestricted = isOrganisationRestricted(organization);
	const isOwner = hasOrganizationRoles(organization, ORG_ROLES_OWNER);
	const isAdmin = hasOrganizationRoles(organization, ORG_ROLES_ADMIN);

	const [, navigate] = useAbsoluteLocation();

	const [view, setView] = useState<TeamView>("members");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	// Both lists share the pager, so any change of what is being listed starts
	// over at the first page rather than landing on a page that no longer exists
	const handleView = useStable((value: string) => {
		setView(value as TeamView);
		setPage(1);
	});

	const handleSearch = useStable((value: string) => {
		setSearch(value);
		setPage(1);
	});

	const handleInvite = useStable(() => {
		openMemberInvitationModal(organization);
	});

	const handleImport = useStable(() => {
		openMemberImportModal(organization);
	});

	const handleExport = useStable(() => {
		const members = membersQuery.data ?? [];

		adapter.saveFile(
			"Export team members",
			`${slugify(organization)}-members.csv`,
			[CSV_FILTER],
			async () => membersToCsv(members),
		);
	});

	const invitations = useMemo(() => {
		return invitesQuery.data?.filter((invite) => invite.status !== "accepted") || [];
	}, [invitesQuery.data]);

	const filteredMembers = useMemo(() => {
		const query = search.trim().toLowerCase();

		return (membersQuery.data ?? []).filter(
			(member) =>
				!query ||
				member.name.toLowerCase().includes(query) ||
				member.username.toLowerCase().includes(query),
		);
	}, [membersQuery.data, search]);

	const filteredInvitations = useMemo(() => {
		const query = search.trim().toLowerCase();

		return invitations.filter((invite) => !query || invite.email.toLowerCase().includes(query));
	}, [invitations, search]);

	const total = view === "members" ? filteredMembers.length : filteredInvitations.length;
	const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

	// Clamped rather than stored, so removing the last member of a page falls
	// back to the final page instead of showing an empty one
	const currentPage = Math.min(page, pageCount);

	const pagedMembers = useMemo(() => {
		return filteredMembers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
	}, [filteredMembers, currentPage]);

	const pagedInvitations = useMemo(() => {
		return filteredInvitations.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
	}, [filteredInvitations, currentPage]);

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
			navigate("/");

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

	const isEmpty = view === "members" ? !filteredMembers.length : !filteredInvitations.length;

	return (
		<Stack>
			<PrimaryTitle fz={32}>Team</PrimaryTitle>

			<Group>
				<SegmentedControl
					value={view}
					onChange={handleView}
					data={[
						{ label: "Members", value: "members" },
						{
							label: (
								<Group
									gap="xs"
									wrap="nowrap"
								>
									Pending
									{!!invitations.length && (
										<Badge
											variant="light"
											size="sm"
											style={{ flexShrink: 0 }}
										>
											{invitations.length}
										</Badge>
									)}
								</Group>
							),
							value: "pending",
						},
					]}
				/>
				<Spacer />
				{isAdmin && (
					<>
						<Menu>
							<Menu.Target>
								<ActionButton label="Additional actions">
									<Icon path={iconDotsVertical} />
								</ActionButton>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item
									disabled={isRestricted}
									leftSection={<Icon path={iconUpload} />}
									onClick={handleImport}
								>
									Invite from CSV
								</Menu.Item>
								<Menu.Item
									disabled={!membersQuery.data?.length}
									leftSection={<Icon path={iconDownload} />}
									onClick={handleExport}
								>
									Export to CSV
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>
						<TextInput
							placeholder={
								view === "members" ? "Search members..." : "Search invitations..."
							}
							leftSection={<Icon path={iconSearch} />}
							value={search}
							onChange={(e) => handleSearch(e.currentTarget.value)}
						/>
						<Button
							size="xs"
							variant="gradient"
							disabled={isRestricted}
							leftSection={<Icon path={iconAccountPlus} />}
							onClick={handleInvite}
						>
							Invite member
						</Button>
					</>
				)}
			</Group>

			{isEmpty ? (
				<EmptyList
					view={view}
					searching={!!search.trim()}
					canInvite={isAdmin}
					isRestricted={isRestricted}
					onInvite={handleInvite}
				/>
			) : (
				<Paper p="md">
					<Table
						className={classes.table}
						verticalSpacing="md"
					>
						<Table.Tbody>
							{view === "members"
								? pagedMembers.map((member) => {
										const isSelf = member.user_id === userId;
										const showLeave =
											normalizeRole(member.role) !== "owner" && isSelf;
										const showOpts =
											normalizeRole(member.role) !== "owner" && isOwner;

										return (
											<Table.Tr key={member.user_id}>
												<Table.Td>
													<Group>
														<Avatar
															src={member.profile_picture}
															name={member.name}
														/>
														<Box>
															<Group gap="sm">
																<Text
																	fw={500}
																	c="bright"
																	className="selectable"
																>
																	{member.name}
																</Text>
																<Badge
																	variant="light"
																	size="sm"
																>
																	{normalizeRole(member.role)}
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
																className="selectable"
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
																		<Icon
																			path={iconDotsVertical}
																		/>
																	</ActionButton>
																</Menu.Target>
																<Menu.Dropdown>
																	<Menu.Item
																		leftSection={
																			<Icon
																				path={
																					iconServerSecure
																				}
																			/>
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
									})
								: pagedInvitations.map((invite) => (
										<Table.Tr key={invite.code}>
											<Table.Td c="bright">
												<Group gap="sm">
													<Text
														fw={500}
														c="bright"
														className="selectable"
													>
														{invite.email}
													</Text>
													<Badge
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

					{pageCount > 1 && (
						<Group
							justify="center"
							mt="md"
						>
							<Pagination
								total={pageCount}
								value={currentPage}
								onChange={setPage}
							/>
						</Group>
					)}
				</Paper>
			)}
		</Stack>
	);
}

interface EmptyListProps {
	view: TeamView;
	searching: boolean;
	canInvite: boolean;
	isRestricted: boolean;
	onInvite: () => void;
}

function EmptyList({ view, searching, canInvite, isRestricted, onInvite }: EmptyListProps) {
	const title = searching
		? "No matches found"
		: view === "pending"
			? "No pending invitations"
			: "No members yet";

	const description = searching
		? "No one in this list matches your search."
		: view === "pending"
			? "Invitations awaiting acceptance will appear here."
			: "Invite your colleagues to collaborate on this organisation.";

	return (
		<Box
			ta="center"
			py={64}
		>
			<Stack
				align="center"
				gap="sm"
			>
				<Text
					c="bright"
					fw={600}
					fz="xl"
				>
					{title}
				</Text>
				<Text
					fz="sm"
					maw={360}
					className="selectable"
				>
					{description}
				</Text>
				{!searching && canInvite && (
					<Button
						mt="xs"
						disabled={isRestricted}
						onClick={onInvite}
					>
						Invite member
					</Button>
				)}
			</Stack>
		</Box>
	);
}
