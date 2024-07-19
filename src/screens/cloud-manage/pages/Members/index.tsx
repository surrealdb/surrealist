import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Group, Menu, ScrollArea, SegmentedControl, Stack, Table, Text, Tooltip } from "@mantine/core";
import { CloudPage } from "../../components/Page";
import { iconDotsVertical, iconPlus } from "~/util/icons";
import { Icon } from "~/components/Icon";
import { useMemo, useState } from "react";
import { useCloudStore } from "~/stores/cloud";

type ListType = "members" | "invites";

function Label({ text, value}: { text: string, value: number }){
	return (
		<Group wrap="nowrap" gap="sm">
			{text}
			{value > 0 && <Text c="bright" fw={600}>{value}</Text>}
		</Group>
	);
}

export function MembersPage() {
	const account = useCloudStore(s => s.profile);

	const [listType, setListType] = useState<ListType>("members");

	const members = useMemo(() => [account], [account]);

	return (
		<CloudPage title="Members">
			<Group
				mt="lg"
				gap="lg"
				mb="xs"
			>
				<Tooltip label="This functionality is not yet available">
					<Button
						variant="gradient"
						leftSection={<Icon path={iconPlus} />}
						radius="sm"
						size="xs"
						disabled
					>
						Invite member
					</Button>
				</Tooltip>
				<SegmentedControl
					value={listType}
					onChange={setListType as any}
					className={classes.listSwitcher}
					data={[
						{ value: "members", label: <Label text="Members" value={1} /> },
						{ value: "invites", label: <Label text="Invitations" value={0} /> },
					]}
				/>
			</Group>
			<Box
				flex={1}
				pos="relative"
			>
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					inset={0}
				>
					{listType === "members" ? (
						<Table className={classes.table}>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Name</Table.Th>
									<Table.Th>Email</Table.Th>
									<Table.Th>Role</Table.Th>
									<Table.Th w={0}>Actions</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{members.map((member) => (
									<Table.Tr key={member.username}>
										<Table.Td>
											<Text c="bright" fw={500}>
												{member.name || "Unknown"}
											</Text>
										</Table.Td>
										<Table.Td>
											{member.username}
										</Table.Td>
										<Table.Td>
											Admin
										</Table.Td>
										<Table.Td>
											<Menu position="right-start">
												<Menu.Target>
													<ActionIcon>
														<Icon path={iconDotsVertical} />
													</ActionIcon>
												</Menu.Target>
												<Menu.Dropdown>
													<Menu.Item disabled>
														Remove
													</Menu.Item>
													<Menu.Item disabled>
														Deactivate
													</Menu.Item>
													<Menu.Item disabled>
														Change role
													</Menu.Item>
												</Menu.Dropdown>
											</Menu>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
					) : (
						// <Table className={classes.table}>
						// 	<Table.Thead>
						// 		<Table.Tr>
						// 			<Table.Th>Name</Table.Th>
						// 			<Table.Th>Email</Table.Th>
						// 			<Table.Th w={0}>Actions</Table.Th>
						// 		</Table.Tr>
						// 	</Table.Thead>
						// 	<Table.Tbody>
						// 		{members.map((member) => (
						// 			<Table.Tr key={member.username}>
						// 				<Table.Td>
						// 					<Text c="bright" fw={500}>
						// 						{member.name || "Unknown"}
						// 					</Text>
						// 				</Table.Td>
						// 				<Table.Td>
						// 					{member.username}
						// 				</Table.Td>
						// 				<Table.Td>
						// 					<Button
						// 						size="xs"
						// 						color="slate"
						// 						radius="sm"
						// 					>
						// 						Revoke
						// 					</Button>
						// 				</Table.Td>
						// 			</Table.Tr>
						// 		))}
						// 	</Table.Tbody>
						// </Table>
						<Stack
							mt={150}
							align="center"
							gap="xs"
						>
							<Text
								fz="lg"
								c="bright"
								fw={500}
							>
								No member invitations are pending
							</Text>
							<Text
								c="slate"
							>
								Press "Invite member" to send a new invitation
							</Text>
						</Stack>
					)}
				</ScrollArea>
			</Box>
		</CloudPage>
	);
}
