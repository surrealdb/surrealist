import { Avatar, AvatarProps, Loader, UnstyledButton } from "@mantine/core";
import { useIsAuthLoading } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";

export function AccountAvatar(props: AvatarProps) {
	const profile = useCloudStore((s) => s.profile);
	const isAuthLoading = useIsAuthLoading();
	const name = profile.name || "Unknown";

	return (
		<Avatar
			size={36}
			name={name}
			src={profile.picture}
			component={UnstyledButton}
			{...props}
		>
			{isAuthLoading && !profile.picture && (
				<Loader
					size="sm"
					color="obsidian.4"
				/>
			)}
		</Avatar>
	);
}
