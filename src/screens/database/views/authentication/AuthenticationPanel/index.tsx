import classes from "./style.module.scss";

import { ActionIcon, Menu, ScrollArea, Stack, Tabs, Text, TextInput, Tooltip } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import equal from "fast-deep-equal";
import { useContextMenu } from "mantine-contextmenu";
import { useMemo } from "react";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useIsConnected } from "~/hooks/connection";
import type { AuthTarget, AuthType, SchemaAccess, SchemaUser } from "~/types";
import { fuzzyMatch } from "~/util/helpers";
import { iconAccount, iconAuth, iconDelete, iconKey, iconPlus, iconSearch } from "~/util/icons";

export interface AuthenticationPanelProps {
	list: AuthType;
	users: SchemaUser[];
	accesses: SchemaAccess[];
	active: AuthTarget | null;
	onChangeList: (type: AuthType) => void;
	onSelect: (target: AuthTarget) => void;
	onDelete: (target: AuthTarget) => void;
	onCreate: (type: AuthType) => void;
}

export function AuthenticationPanel({
	users,
	accesses,
	active,
	onSelect,
	onDelete,
	onCreate,
}: AuthenticationPanelProps) {
	const isConnected = useIsConnected();
	const { showContextMenu } = useContextMenu();

	const [type, setType] = useInputState<AuthType>("user");
	const [search, setSearch] = useInputState("");

	const userList = useMemo(() => {
		return users.filter((u) => fuzzyMatch(search, u.name));
	}, [users, search]);

	const accessList = useMemo(() => {
		return accesses.filter((a) => fuzzyMatch(search, a.name));
	}, [accesses, search]);

	const pluralName = type === "user" ? "system users" : "access methods";
	const itemCount = type === "user" ? userList.length : accessList.length;

	return (
		<ContentPane
			title="Authentication"
			icon={iconAuth}
			rightSection={
				<Menu position="right-start">
					<Menu.Target>
						<Tooltip label="New authentication...">
							<ActionIcon
								aria-label="Create new authentication"
								disabled={!isConnected}
							>
								<Icon path={iconPlus} />
							</ActionIcon>
						</Tooltip>
					</Menu.Target>
					<Menu.Dropdown>
						<Menu.Item
							onClick={() => onCreate("user")}
							leftSection={<Icon path={iconAccount} />}
						>
							Create system user
						</Menu.Item>
						<Menu.Item
							onClick={() => onCreate("access")}
							leftSection={<Icon path={iconKey} />}
						>
							Create access method
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			}
		>
			<Tabs
				value={type}
				onChange={setType as any}
			>
				<Tabs.List grow>
					<Tabs.Tab
						value="user"
						// leftSection={<Icon path={iconAccount} size="sm" />}
					>
						System Users
					</Tabs.Tab>
					<Tabs.Tab
						value="access"
						// leftSection={<Icon path={iconKey} size="sm" />}
					>
						Access methods
					</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			<ScrollArea
				pos="absolute"
				top={42}
				left={12}
				right={12}
				bottom={12}
				classNames={{
					viewport: classes.scroller,
				}}
			>
				<Stack
					gap="xs"
					pb="md"
				>
					{itemCount > 0 ? (
						<TextInput
							placeholder={`Search ${pluralName}...`}
							leftSection={<Icon path={iconSearch} />}
							value={search}
							spellCheck={false}
							onChange={setSearch}
							variant="unstyled"
							autoFocus
						/>
					) : (
						<Text
							c="slate"
							ta="center"
							mt="lg"
						>
							No {pluralName} found
						</Text>
					)}

					{search && itemCount === 0 && (
						<Text
							c="slate"
							ta="center"
							mt="lg"
						>
							No {pluralName} matched
						</Text>
					)}

					{type === "user" && userList.map((u, i) => {
						const target: AuthTarget = ["user", u.name];
						const isActive = equal(active, target);

						return (
							<Entry
								key={i}
								isActive={isActive}
								onClick={() => onSelect(target)}
								leftSection={<Icon path={iconAccount} />}
								onContextMenu={showContextMenu([
									{
										key: "open",
										title: "Edit user",
										icon: <Icon path={iconAccount} />,
										onClick: () => onSelect(target),
									},
									{
										key: "remove",
										title: "Remove user",
										color: "pink.7",
										icon: <Icon path={iconDelete} />,
										onClick: () => onDelete(target),
									},
								])}
							>
								<Text
									style={{
										textOverflow: "ellipsis",
										overflow: "hidden",
									}}
								>
									{u.name}
								</Text>
							</Entry>
						);
					})}

					{type === "access" && accessList.map((a, i) => {
						const target: AuthTarget = ["access", a.name];
						const isActive = equal(active, target);

						return (
							<Entry
								key={i}
								isActive={isActive}
								onClick={() => onSelect(target)}
								leftSection={<Icon path={iconKey} />}
								onContextMenu={showContextMenu([
									{
										key: "open",
										title: "Edit access method",
										icon: <Icon path={iconAccount} />,
										onClick: () => onSelect(target),
									},
									{
										key: "remove",
										title: "Remove access method",
										color: "pink.7",
										icon: <Icon path={iconDelete} />,
										onClick: () => onDelete(target),
									},
								])}
							>
								<Text
									style={{
										textOverflow: "ellipsis",
										overflow: "hidden",
									}}
								>
									{a.name}
								</Text>
							</Entry>
						);
					})}
				</Stack>
			</ScrollArea>
		</ContentPane>
	);
}
