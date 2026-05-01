import { Avatar, AvatarProps, Loader, UnstyledButton } from "@mantine/core";
import { useAuthentication } from "~/providers/Auth";

export function AccountAvatar(props: AvatarProps) {
	const { user, isLoading: isAuthLoading } = useAuthentication();
	const name = user?.name || "Unknown";

	return (
		<Avatar
			size={36}
			name={name}
			src={user?.picture}
			component={UnstyledButton}
			{...props}
		>
			{isAuthLoading && !user?.picture && (
				<Loader
					size="sm"
					color="obsidian.4"
				/>
			)}
		</Avatar>
	);
}
