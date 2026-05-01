import { Box, Button, Group, Menu, Text } from "@mantine/core";
import {
	Icon,
	iconBook,
	iconChevronRight,
	iconCommand,
	iconExitToAp,
	iconMoon,
	iconOpen,
	iconStar,
	iconSun,
	iconTune,
} from "@surrealdb/ui";
import { adapter } from "~/adapter";
import { useSetting } from "~/hooks/config";
import { useTheme } from "~/hooks/theme";
import { useAuthentication } from "~/providers/Auth";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { AccountAvatar } from "../AccountAvatar";

export function CloudAccount() {
	const {
		user,
		signIn,
		signOut,
		isAuthenticated,
		isLoading: isAuthLoading,
	} = useAuthentication();

	const [{ themes }] = useFeatureFlags();
	const [, setColorSchemePref] = useSetting("appearance", "colorScheme");
	const effectiveScheme = useTheme();

	if (!isAuthenticated) {
		return (
			<Button
				variant="gradient"
				size="xs"
				disabled={isAuthLoading}
				onClick={() => signIn()}
				rightSection={<Icon path={iconChevronRight} />}
			>
				Sign in
			</Button>
		);
	}

	const name = user?.name || "Unknown";

	return (
		<Menu
			position="bottom-end"
			trigger="click-hover"
			disabled={isAuthLoading}
			transitionProps={{
				transition: "scale-y",
			}}
		>
			<Menu.Target>
				<Box>
					<AccountAvatar />
				</Box>
			</Menu.Target>
			<Menu.Dropdown miw={200}>
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
				<Menu.Item
					leftSection={<Icon path={iconExitToAp} />}
					onClick={() => signOut()}
				>
					Sign out
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
}
