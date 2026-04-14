import { Anchor, Box, Button, Group, Menu, Text } from "@mantine/core";
import {
	Icon,
	iconChevronRight,
	iconExitToAp,
	iconOpen,
	iconOrganization,
	iconTune,
} from "@surrealdb/ui";
import { useIsAuthenticated, useIsAuthLoading } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useAuthentication } from "~/providers/Auth";
import { AccountAvatar } from "../AccountAvatar";

export function CloudAccount() {
	const { user, signIn, signOut } = useAuthentication();

	const isAuthenticated = useIsAuthenticated();
	const isAuthLoading = useIsAuthLoading();
	const [, navigate] = useAbsoluteLocation();

	if (!isAuthenticated) {
		return (
			<Button
				variant="gradient"
				size="xs"
				disabled={isAuthLoading}
				onClick={signIn}
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
				<div>
					<AccountAvatar />
				</div>
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
				{/* <Stack gap="xs"> */}
				<Anchor href="https://account.surrealdb.com">
					<Menu.Item
						leftSection={<Icon path={iconTune} />}
						rightSection={<Icon path={iconOpen} />}
					>
						Manage account
					</Menu.Item>
				</Anchor>
				<Menu.Item
					leftSection={<Icon path={iconOrganization} />}
					onClick={() => {
						navigate("/overview");
					}}
				>
					Organisations
				</Menu.Item>
				<Menu.Divider />
				<Menu.Item
					leftSection={<Icon path={iconExitToAp} />}
					onClick={signOut}
				>
					Sign out
				</Menu.Item>
				{/* </Stack> */}
			</Menu.Dropdown>
		</Menu>
	);
}
