import { ActionIcon, Box, Menu } from "@mantine/core";
import { Icon, iconViewList } from "@surrealdb/ui";
import { useAuthentication } from "~/providers/Auth";
import { AccountAvatar } from "../AccountAvatar";
import { useAccountActions } from "./account-actions";

export function AccountMenu() {
	const { isAuthenticated, isLoading } = useAuthentication();
	const { profile, rows } = useAccountActions();

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
