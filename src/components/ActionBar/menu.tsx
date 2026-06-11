import { ActionIcon, Box, Button, Divider, Drawer, Group, Menu, Stack, Text } from "@mantine/core";
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
import type { ReactNode } from "react";
import { adapter } from "~/adapter";
import { useBoolean } from "~/hooks/boolean";
import { useSetting } from "~/hooks/config";
import { useIsDesktop } from "~/hooks/responsive";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useTheme } from "~/hooks/theme";
import { useAuthentication } from "~/providers/Auth";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { AccountAvatar } from "../AccountAvatar";
import { Shortcut } from "../Shortcut";

type MenuRow =
	| {
			kind: "item";
			icon: string;
			label: string;
			right?: ReactNode;
			onClick: () => void;
	  }
	| { kind: "divider" };

export function AccountMenu() {
	const { user, signOut, signIn, isAuthenticated, isLoading } = useAuthentication();
	const [, navigate] = useAbsoluteLocation();
	const isDesktop = useIsDesktop();

	const [{ themes }] = useFeatureFlags();
	const [, setColorSchemePref] = useSetting("appearance", "colorScheme");
	const effectiveScheme = useTheme();

	const [drawerOpen, drawerHandle] = useBoolean();

	const name = user?.name || "Unknown";

	const rows: MenuRow[] = [
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

	const profile = isAuthenticated && (
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
	);

	if (!isDesktop) {
		return (
			<>
				<AccountAvatar onClick={drawerHandle.open} />

				<Drawer
					opened={drawerOpen}
					onClose={drawerHandle.close}
					position="bottom"
					withCloseButton={false}
					padding="lg"
					styles={{
						content: {
							height: "auto",
							maxHeight: "85vh",
							borderTopLeftRadius: "var(--mantine-radius-lg)",
							borderTopRightRadius: "var(--mantine-radius-lg)",
						},
					}}
				>
					<Stack gap="xs">
						{profile && (
							<>
								<Box px="sm">{profile}</Box>
								<Divider />
							</>
						)}

						{rows.map((row, index) =>
							row.kind === "divider" ? (
								<Divider key={index} />
							) : (
								<Button
									key={index}
									variant="subtle"
									color="slate"
									fullWidth
									justify="flex-start"
									size="md"
									leftSection={<Icon path={row.icon} />}
									rightSection={row.right}
									onClick={() => {
										row.onClick();
										drawerHandle.close();
									}}
									styles={{ label: { flex: 1, textAlign: "left" } }}
								>
									{row.label}
								</Button>
							),
						)}
					</Stack>
				</Drawer>
			</>
		);
	}

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
							{profile}
						</Box>
						<Menu.Divider />
					</>
				)}
				{rows.map((row, index) =>
					row.kind === "divider" ? (
						<Menu.Divider key={index} />
					) : (
						<Menu.Item
							key={index}
							leftSection={<Icon path={row.icon} />}
							rightSection={row.right}
							onClick={row.onClick}
						>
							{row.label}
						</Menu.Item>
					),
				)}
			</Menu.Dropdown>
		</Menu>
	);
}
