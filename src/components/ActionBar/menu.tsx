import { ActionIcon, Box, Group, Menu, Text } from "@mantine/core";
import {
	Icon,
	iconAccount,
	iconBook,
	iconChat,
	iconCog,
	iconCommand,
	iconExitToAp,
	iconMoon,
	iconOpen,
	iconStar,
	iconSun,
	iconTune,
	iconViewList,
} from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { useSetting } from "~/hooks/config";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useTheme } from "~/hooks/theme";
import { useAuthentication } from "~/providers/Auth";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { AccountAvatar } from "../AccountAvatar";
import { Shortcut } from "../Shortcut";

export function AccountMenu() {
	const { user, signOut, signIn, isAuthenticated, isLoading } = useAuthentication();
	const [, navigate] = useAbsoluteLocation();

	const [{ themes }] = useFeatureFlags();
	const [, setColorSchemePref] = useSetting("appearance", "colorScheme");
	const effectiveScheme = useTheme();

	const name = user?.name || "Unknown";

	return (
		<Menu
			position="bottom-end"
			trigger="click-hover"
			disabled={isLoading}
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>
				{isAuthenticated ? (
					<AccountAvatar />
				) : (
					<ActionIcon>
						<Icon path={iconViewList} />
					</ActionIcon>
				)}
			</Menu.Target>
			<Menu.Dropdown miw={200}>
				{isAuthenticated && (
					<>
						<Box
							p="sm"
							mb="xs"
						>
							<Group>
								<AccountAvatar />
								<Box>
									<Text
										fz="md"
										fw={500}
										c="bright"
									>
										{name}
									</Text>
									<Text
										fz="sm"
										c="obsidian"
										mt={-3}
									>
										{user?.email}
									</Text>
								</Box>
							</Group>
						</Box>
						<Menu.Divider />
					</>
				)}
				<Menu.Item
					leftSection={<Icon path={iconStar} />}
					onClick={() => dispatchIntent("open-changelog")}
				>
					What&apos;s new?
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconCommand} />}
					onClick={() => dispatchIntent("open-settings", { tab: "keybindings" })}
				>
					Keyboard shortcuts
				</Menu.Item>
				{themes && (
					<Menu.Item
						leftSection={
							<Icon path={effectiveScheme === "light" ? iconMoon : iconSun} />
						}
						onClick={() =>
							setColorSchemePref(effectiveScheme === "light" ? "dark" : "light")
						}
					>
						{effectiveScheme === "light" ? "Dark" : "Light"} theme
					</Menu.Item>
				)}
				<Menu.Divider />
				<Menu.Item
					leftSection={<Icon path={iconCog} />}
					rightSection={
						<Shortcut
							value={["mod", ","]}
							size="xs"
						/>
					}
					onClick={() => dispatchIntent("open-settings")}
				>
					Settings
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconChat} />}
					onClick={() => navigate("/support")}
				>
					Support centre
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item
					leftSection={<Icon path={iconBook} />}
					rightSection={<Icon path={iconOpen} />}
					onClick={() => adapter.openUrl("https://surrealdb.com/docs")}
				>
					Documentation
				</Menu.Item>
				<Menu.Item
					leftSection={<Icon path={iconTune} />}
					rightSection={<Icon path={iconOpen} />}
					onClick={() => adapter.openUrl("https://account.surrealdb.com")}
				>
					Account settings
				</Menu.Item>
				<Menu.Divider />
				{isAuthenticated ? (
					<Menu.Item
						leftSection={<Icon path={iconExitToAp} />}
						onClick={() => signOut()}
					>
						Sign out
					</Menu.Item>
				) : (
					<Menu.Item
						leftSection={<Icon path={iconAccount} />}
						onClick={() => signIn()}
					>
						Sign in
					</Menu.Item>
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
