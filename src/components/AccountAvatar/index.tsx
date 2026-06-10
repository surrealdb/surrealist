import { Avatar, AvatarProps, Loader, UnstyledButton } from "@mantine/core";
import { Icon, iconAccount } from "@surrealdb/ui";
import { useAuthentication } from "~/providers/Auth";

export function AccountAvatar(props: AvatarProps) {
	const { user, isLoading: isAuthLoading } = useAuthentication();

	return (
		<Avatar
			size={33}
			name={user?.name}
			src={user?.picture}
			component={UnstyledButton}
			imageProps={{ referrerPolicy: "no-referrer" }}
			{...props}
		>
			{isAuthLoading && !user?.picture ? (
				<Loader
					size="sm"
					color="obsidian.4"
				/>
			) : !user ? (
				<Icon path={iconAccount} />
			) : null}
		</Avatar>
	);
}
