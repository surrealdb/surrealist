import { Avatar, AvatarProps, Loader, UnstyledButton } from "@mantine/core";
import { useIsAuthLoading } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";

export function AccountAvatar(props: AvatarProps) {
	const { user } = useAuthentication();
	const isAuthLoading = useIsAuthLoading();
	const name = user?.name || "Unknown";

	console.log("U", user);

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
