import classes from "../style.module.scss";

import { ActionIcon, Badge, Group, Menu, Paper, Stack, Table } from "@mantine/core";
import { OrganizationTabProps } from "../types";
import { Section } from "~/components/Section";
import { useCloudMembersQuery } from "~/cloud/queries/members";
import { Icon } from "~/components/Icon";
import { iconDelete, iconDotsVertical, iconServerSecure } from "~/util/icons";

export function OrganizationTeamTab({ organization }: OrganizationTabProps) {
	const { data } = useCloudMembersQuery(organization.id);

	return (
		<Stack>
			<Section
				title="Team members"
				description="Manage the members of your organization"
			>
				<Paper p="md">
					<Table className={classes.table}>
						<Table.Tbody>
							{data?.map((member) => {
								return (
									<Table.Tr key={member.user_id}>
										<Table.Td c="bright">
											<Group>
												{member.user_id}
												<Badge
													color="slate"
													variant="light"
												>
													{member.role}
												</Badge>
											</Group>
										</Table.Td>
										<Table.Td
											w={0}
											pr="md"
											style={{ textWrap: "nowrap" }}
										>
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
													>
														Update role
													</Menu.Item>
													<Menu.Divider />
													<Menu.Item
														leftSection={
															<Icon
																path={iconDelete}
																c="red"
															/>
														}
														// onClick={handle}
														c="red"
													>
														Remove member
													</Menu.Item>
												</Menu.Dropdown>
											</Menu>
										</Table.Td>
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				</Paper>
			</Section>
			<Section
				title="Pending invitations"
				description="View or revoke pending invitations"
			>
				<Paper p="md">test</Paper>
			</Section>
		</Stack>
	);
}
