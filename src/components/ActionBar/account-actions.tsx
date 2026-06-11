import { Box, Group, Text } from "@mantine/core";
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
} from "@surrealdb/ui";
import type { ReactNode } from "react";
import { adapter } from "~/adapter";
import { useSetting } from "~/hooks/config";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useTheme } from "~/hooks/theme";
import { useAuthentication } from "~/providers/Auth";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { AccountAvatar } from "../AccountAvatar";
import { Shortcut } from "../Shortcut";

export type AccountRow =
	| {
			kind: "item";
			icon: string;
			label: string;
			right?: ReactNode;
			onClick: () => void;
	  }
	| { kind: "divider" };

/**
 * Shared account-menu content (profile block + action rows), used by both the
 * desktop dropdown (`AccountMenu`) and the mobile bottom-card account panel.
 */
export function useAccountActions(): { profile: ReactNode; rows: AccountRow[] } {
	const { user, signOut, signIn, isAuthenticated } = useAuthentication();
	const [, navigate] = useAbsoluteLocation();

	const [{ themes }] = useFeatureFlags();
	const [, setColorSchemePref] = useSetting("appearance", "colorScheme");
	const effectiveScheme = useTheme();

	const name = user?.name || "Unknown";

	const rows: AccountRow[] = [
		{
			kind: "item",
			icon: iconStar,
			label: "What's new?",
			onClick: () => dispatchIntent("open-changelog"),
		},
		{
			kind: "item",
			icon: iconCommand,
			label: "Keyboard shortcuts",
			onClick: () => dispatchIntent("open-settings", { tab: "keybindings" }),
		},
		...(themes
			? [
					{
						kind: "item" as const,
						icon: effectiveScheme === "light" ? iconMoon : iconSun,
						label: `${effectiveScheme === "light" ? "Dark" : "Light"} theme`,
						onClick: () =>
							setColorSchemePref(effectiveScheme === "light" ? "dark" : "light"),
					},
				]
			: []),
		{ kind: "divider" },
		{
			kind: "item",
			icon: iconCog,
			label: "Settings",
			right: (
				<Shortcut
					value={["mod", ","]}
					size="xs"
				/>
			),
			onClick: () => dispatchIntent("open-settings"),
		},
		{
			kind: "item",
			icon: iconChat,
			label: "Support centre",
			onClick: () => navigate("/support"),
		},
		{ kind: "divider" },
		{
			kind: "item",
			icon: iconBook,
			label: "Documentation",
			right: <Icon path={iconOpen} />,
			onClick: () => adapter.openUrl("https://surrealdb.com/docs"),
		},
		{
			kind: "item",
			icon: iconTune,
			label: "Account settings",
			right: <Icon path={iconOpen} />,
			onClick: () => adapter.openUrl("https://account.surrealdb.com"),
		},
		{ kind: "divider" },
		isAuthenticated
			? {
					kind: "item",
					icon: iconExitToAp,
					label: "Sign out",
					onClick: () => signOut(),
				}
			: {
					kind: "item",
					icon: iconAccount,
					label: "Sign in",
					onClick: () => signIn(),
				},
	];

	const profile = isAuthenticated ? (
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
	) : null;

	return { profile, rows };
}
