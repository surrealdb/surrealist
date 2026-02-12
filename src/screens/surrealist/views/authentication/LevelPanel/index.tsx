import { ActionIcon, Badge, Box, Group, Menu, ScrollArea, Stack, Text } from "@mantine/core";
import { Icon, iconAccount, iconDotsVertical, iconKey, iconPlus } from "@surrealdb/ui";
import { capitalize } from "radash";
import { type ReactNode, useState } from "react";
import { escapeIdent } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { Entry } from "~/components/Entry";
import { ContentPane } from "~/components/Pane";
import { useBoolean } from "~/hooks/boolean";
import { useIsConnected } from "~/hooks/connection";
import { useIntent } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import {
	SelectDatabase,
	type SelectDatabaseProps,
} from "~/screens/surrealist/components/SelectDatabase";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import type { Base, SchemaAccess, SchemaUser } from "~/types";
import { ON_STOP_PROPAGATION } from "~/util/helpers";
import { syncConnectionSchema } from "~/util/schema";
import { AccessEditorModal } from "./models/access";
import { UserEditorModal } from "./models/users";
import classes from "./style.module.scss";

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

	const [showUserEditor, showUserEditorHandle] = useBoolean();
	const [showAccessEditor, showAccessEditorHandle] = useBoolean();

	const [editingUser, setEditingUser] = useState<SchemaUser | null>(null);
	const [editingAccess, setEditingAccess] = useState<SchemaAccess | null>(null);

	const createUser = useStable(() => {
		setEditingUser(null);
		showUserEditorHandle.open();
	});

	const createAccess = useStable(() => {
		setEditingAccess(null);
		showAccessEditorHandle.open();
	});

	const editUser = useStable((user: SchemaUser) => {
		setEditingUser(user);
		showUserEditorHandle.open();
	});

	const editAccess = useStable((access: SchemaAccess) => {
		setEditingAccess(access);
		showAccessEditorHandle.open();
	});

	const removeUser = useConfirmation<SchemaUser>({
		title: "Remove system user",
		message: `This will remove the user from ${level.toLocaleLowerCase()} authentication and reject any future sign-in attempts. Are you sure?`,
		skippable: true,
		onConfirm: async (value) => {
			await executeQuery(`REMOVE USER ${escapeIdent(value.name)} ON ${level}`);
			await syncConnectionSchema();
		},
	});

	const removeAccess = useConfirmation<SchemaAccess>({
		title: "Remove access method",
		message: `This will remove the access method from ${level.toLocaleLowerCase()} authentication and prevent any future sign-in attempts using this method. Are you sure?`,
		skippable: true,
		onConfirm: async (value) => {
			await executeQuery(`REMOVE ACCESS ${escapeIdent(value.name)} ON ${level}`);
			await syncConnectionSchema();
		},
	});

	const nameTitle = capitalize(level);
	const nameLower = nameTitle.toLowerCase();

	const isEmpty = users.length === 0 && accesses.length === 0;

	useIntent("create-user", (opts) => {
		if (opts.level === level) {
			createUser();
		}
	});

	return (
		<ContentPane
			title={`${nameTitle} Authentication`}
			icon={icon}
			rightSection={
				<Menu position="bottom">
					<Menu.Target>
						<div>
							<ActionButton
								label={`New ${nameTitle} authentication`}
								disabled={!isConnected || !!disabled}
							>
								<Icon path={iconPlus} />
							</ActionButton>
						</div>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Item
							onClick={createUser}
							leftSection={<Icon path={iconAccount} />}
						>
							New system user
						</Menu.Item>
						<Menu.Item
							onClick={createAccess}
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
							c="obsidian"
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
							{accesses.length > 0 && (
								<AuthList
									name="Access Methods"
									list={accesses}
									icon={iconKey}
									color={color}
									onEdit={editAccess}
									onRemove={removeAccess}
									onOptions={(access) => (
										<Menu position="right-start">
											<Menu.Target>
												<ActionIcon
													variant="subtle"
													component={Box}
												>
													<Icon path={iconDotsVertical} />
												</ActionIcon>
											</Menu.Target>
											<Menu.Dropdown>
												<Menu.Item onClick={() => editAccess(access)}>
													View access method
												</Menu.Item>
												<Menu.Item
													onClick={() => removeAccess(access)}
													color="red"
												>
													Remove access method
												</Menu.Item>
											</Menu.Dropdown>
										</Menu>
									)}
								/>
							)}

							{users.length > 0 && (
								<AuthList
									name="System Users"
									list={users}
									icon={iconAccount}
									color={color}
									onEdit={editUser}
									onRemove={removeUser}
									onOptions={(user) => (
										<Menu position="right-start">
											<Menu.Target>
												<ActionIcon
													variant="subtle"
													component={Box}
												>
													<Icon path={iconDotsVertical} />
												</ActionIcon>
											</Menu.Target>
											<Menu.Dropdown>
												<Menu.Item onClick={() => editUser(user)}>
													Edit system user
												</Menu.Item>
												<Menu.Item
													onClick={() => removeUser(user)}
													color="red"
												>
													Remove system user
												</Menu.Item>
											</Menu.Dropdown>
										</Menu>
									)}
									onDetails={(user) =>
										user.roles.map((r) => capitalize(r)).join(", ")
									}
								/>
							)}
						</Stack>
					</ScrollArea>
				</>
			)}

			<UserEditorModal
				opened={showUserEditor}
				level={level}
				onClose={showUserEditorHandle.close}
				existing={editingUser}
			/>

			<AccessEditorModal
				opened={showAccessEditor}
				level={level}
				onClose={showAccessEditorHandle.close}
				existing={editingAccess}
			/>
		</ContentPane>
	);
}

interface AuthListProps<T> {
	name: string;
	list: T[];
	icon: string;
	color: string;
	onEdit: (item: T) => void;
	onRemove: (item: T) => void;
	onOptions?: (item: T) => ReactNode;
	onDetails?: (item: T) => string;
}

function AuthList<T extends { name: string }>({
	name,
	list,
	icon,
	color,
	onEdit,
	onOptions,
	onDetails,
}: AuthListProps<T>) {
	return (
		<Box>
			<Group mb="sm">
				<Text
					c="bright"
					fw={600}
					fz="lg"
				>
					{name}
				</Text>
				<Badge
					bg="var(--mantine-color-body)"
					radius="sm"
					c="inherit"
				>
					{list.length}
				</Badge>
			</Group>
			<Stack gap={4}>
				{list.map((item) => {
					const details = onDetails ? onDetails(item) : "";

					return (
						<Entry
							key={item.name}
							onClick={() => onEdit(item)}
							leftSection={
								<Icon
									path={icon}
									c={color}
								/>
							}
							rightSection={
								onOptions && (
									<Box onClick={ON_STOP_PROPAGATION}>{onOptions(item)}</Box>
								)
							}
						>
							<Box ta="start">
								<Text>{item.name}</Text>
								{details && (
									<Text
										c="obsidian"
										fz="sm"
										mt={-3}
									>
										{details}
									</Text>
								)}
							</Box>
						</Entry>
					);
				})}
			</Stack>
		</Box>
	);
}
