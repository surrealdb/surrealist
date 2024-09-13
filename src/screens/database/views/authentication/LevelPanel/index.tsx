import classes from "./style.module.scss";

import {
	ActionIcon,
	Badge,
	Box,
	Group,
	Menu,
	ScrollArea,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";

import { capitalize } from "radash";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useIsConnected } from "~/hooks/connection";
import {
	SelectDatabase,
	type SelectDatabaseProps,
} from "~/screens/database/components/SelectDatabase";
import type { Base, SchemaAccess, SchemaUser } from "~/types";
import { iconAccount, iconKey, iconPlus } from "~/util/icons";

const ROLES = [
	{ value: "OWNER", label: "Owner" },
	{ value: "EDITOR", label: "Editor" },
	{ value: "VIEWER", label: "Viewer" },
];

interface DisabledState {
	message: string;
	selector: SelectDatabaseProps;
}

export interface LevelPanelProps {
	level: Base;
	icon: string;
	color: string;
	users: SchemaUser[];
	accesses: SchemaAccess[];
	disabled?: DisabledState | false;
}

export function LevelPanel({ level, icon, color, disabled, users, accesses }: LevelPanelProps) {
	const isConnected = useIsConnected();

	const nameTitle = capitalize(level);
	const nameLower = nameTitle.toLowerCase();

	const userList = users.filter((user) => user.base === level);
	const accessList = accesses.filter((access) => access.base === level);

	const isEmpty = userList.length === 0 && accessList.length === 0;

	return (
		<ContentPane
			title={`${nameTitle} Authentication`}
			icon={icon}
			rightSection={
				<Menu position="bottom">
					<Menu.Target>
						<Tooltip label="New authentication...">
							<ActionIcon
								aria-label="Create new authentication"
								disabled={!isConnected || !!disabled}
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Tooltip>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Item
							// onClick={() => onCreate("user")}
							leftSection={<Icon path={iconAccount} />}
						>
							New system user
						</Menu.Item>
						<Menu.Item
							// onClick={() => onCreate("access")}
							leftSection={<Icon path={iconKey} />}
						>
							New access method
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			}
		>
			{disabled ? (
				<Box
					maw={250}
					mx="auto"
				>
					<Text
						c="slate"
						ta="center"
						mt="lg"
					>
						{disabled.message}
					</Text>
					<SelectDatabase
						mt="lg"
						{...disabled.selector}
					/>
				</Box>
			) : (
				<>
					{isEmpty && (
						<Text
							c="slate"
							ta="center"
							mt="lg"
						>
							No {nameLower} authentication found
						</Text>
					)}

					<ScrollArea
						pos="absolute"
						top={0}
						left={12}
						right={12}
						bottom={12}
						classNames={{
							viewport: classes.scroller,
						}}
					>
						<Stack gap="xl">
							{accessList.length > 0 && (
								<Box>
									<Group mb="sm">
										<Text
											c="bright"
											fw={600}
											fz="lg"
										>
											Access Methods
										</Text>
										<Badge color="slate">{accessList.length}</Badge>
									</Group>
									<Stack gap={4}>
										{accessList.map((access) => (
											<Entry
												key={access.name}
												leftSection={
													<Icon
														path={iconKey}
														c={color}
													/>
												}
											>
												<Box ta="start">
													<Text>{access.name}</Text>
													<Text
														c="slate"
														fz="sm"
														mt={-3}
													>
														Todo
													</Text>
												</Box>
											</Entry>
										))}
									</Stack>
								</Box>
							)}

							{userList.length > 0 && (
								<Box>
									<Group mb="sm">
										<Text
											c="bright"
											fw={600}
											fz="lg"
										>
											System Users
										</Text>
										<Badge color="slate">{userList.length}</Badge>
									</Group>
									<Stack gap={4}>
										{userList.map((user) => (
											<Entry
												key={user.name}
												leftSection={
													<Icon
														path={iconAccount}
														c={color}
													/>
												}
											>
												<Box ta="start">
													<Text>{user.name}</Text>
													<Text
														c="slate"
														fz="sm"
														mt={-3}
													>
														{user.roles
															.map((r) => capitalize(r))
															.join(", ")}
													</Text>
												</Box>
											</Entry>
										))}
									</Stack>
								</Box>
							)}
						</Stack>
					</ScrollArea>
				</>
			)}
		</ContentPane>
	);
}
