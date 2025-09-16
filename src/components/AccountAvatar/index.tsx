import { Avatar, AvatarProps, Loader, UnstyledButton } from "@mantine/core";
import { useCloudStore } from "~/stores/cloud";

export function AccountAvatar(props: AvatarProps) {
	const profile = useCloudStore((s) => s.profile);
	const state = useCloudStore((s) => s.authState);
	const name = profile.name || "Unknown";

	return (
		<Avatar
			radius="md"
			size={36}
			name={name}
			src={profile.picture}
			component={UnstyledButton}
			{...props}
		>
			{state === "loading" && !profile.picture && (
				<Loader
					size="sm"
					color="slate.4"
				/>
			)}
		</Avatar>
	);
}
