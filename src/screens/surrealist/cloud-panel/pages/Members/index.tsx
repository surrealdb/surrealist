import {
	ActionIcon,
	Box,
	Button,
	Center,
	Group,
	Indicator,
	Loader,
	Menu,
	ScrollArea,
	SegmentedControl,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Fragment, useMemo, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { useCloudStore } from "~/stores/cloud";
import { iconCheck, iconDotsVertical, iconPlus, iconSearch, iconTune } from "~/util/icons";
import { InviteModal } from "./modals/invite";
import classes from "./style.module.scss";

interface Filter {
	type: string;
	value: string;
	label: string;
}

type ListType = "members" | "invites";

function Label({ text, value }: { text: string; value: number }) {
	return (
		<Group
			wrap="nowrap"
			gap="sm"
		>
			{text}
			{value > 0 && (
				<Text
					c="bright"
					fw={600}
				>
					{value}
				</Text>
			)}
		</Group>
	);
}

export function MembersPage() {
	const account = useCloudStore((s) => s.profile);
	const [filter, setFilter] = useState<Filter | null>(null);

	const isPending = useCloudStore((s) => s.authState) === "loading";

	const [showInvite, inviteHandle] = useDisclosure();
	const [listType, setListType] = useState<ListType>("members");

	const filterTypes = useMemo(() => {
		return [
			{
				title: "Roles",
				options: [
					{ type: "role", value: "admin", label: "Admin" },
					{ type: "role", value: "editor", label: "Editor" },
					{ type: "role", value: "reporter", label: "Reporter" },
				],
			},
			{
				title: "Status",
				options: [
					{ type: "status", value: "enabled", label: "Enabled" },
					{ type: "status", value: "disabled", label: "Disabled" },
				],
			},
		];
	}, []);

	const members = useMemo(() => [account], [account]);

	return (
		<>
			{isPending ? (
				<Center flex={1}>
					<Loader />
				</Center>
			) : (
				<>
					<Group
						gap="lg"
						mb="xs"
					>
						<Tooltip label="Unavailable for Starter plan">
							<Button
								variant="gradient"
								leftSection={<Icon path={iconPlus} />}
								radius="sm"
								size="xs"
								onClick={inviteHandle.open}
								disabled
							>
								Invite members
							</Button>
						</Tooltip>
						<SegmentedControl
							value={listType}
							onChange={setListType as any}
							className={classes.listSwitcher}
							data={[
								{
									value: "members",
									label: (
										<Label
											text="Members"
											value={1}
										/>
									),
								},
								{
									value: "invites",
									label: (
										<Label
											text="Invitations"
											value={0}
										/>
									),
								},
							]}
						/>
						<Spacer />
						<Menu>
							<Menu.Target>
								<Indicator
									disabled={!filter}
									color="blue"
									size={7}
								>
									<ActionButton
										variant="subtle"
										color="slate"
										label="Filter members"
										disabled={members.length === 0}
									>
										<Icon path={iconTune} />
									</ActionButton>
								</Indicator>
							</Menu.Target>
							<Menu.Dropdown miw={150}>
								{filterTypes.map((type) => (
									<Fragment key={type.title}>
										<Menu.Label>{type.title}</Menu.Label>
										{type.options.map((option) => {
											const isActive = filter?.value === option.value;

											return (
												<Menu.Item
													key={option.value}
													onClick={() =>
														setFilter(isActive ? null : option)
													}
													rightSection={
														isActive && <Icon path={iconCheck} />
													}
												>
													{option.label}
												</Menu.Item>
											);
										})}
									</Fragment>
								))}
							</Menu.Dropdown>
						</Menu>
						<TextInput
							value={""}
							onChange={() => { }}
							placeholder="Search members"
							leftSection={
								<Icon
									path={iconSearch}
									size="sm"
								/>
							}
							radius="sm"
							size="xs"
							miw={250}
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
													<Text
														c="bright"
														fw={500}
													>
														{member.name || "Unknown"}
													</Text>
												</Table.Td>
												<Table.Td>{member.username}</Table.Td>
												<Table.Td>Admin</Table.Td>
												<Table.Td>
													<Menu position="right-start">
														<Menu.Target>
															<ActionIcon>
																<Icon path={iconDotsVertical} />
															</ActionIcon>
														</Menu.Target>
														<Menu.Dropdown>
															<Menu.Item disabled>Remove</Menu.Item>
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
									<Text c="slate">
										Press "Invite member" to send a new invitation
									</Text>
								</Stack>
							)}
						</ScrollArea>

						<InviteModal
							opened={showInvite}
							onClose={inviteHandle.close}
						/>
					</Box>
				</>
			)}
		</>
	);
}

export default MembersPage;
