import { Center, Text } from "@mantine/core";
import { Group, Loader } from "@mantine/core";
import { PropsWithChildren, useEffect } from "react";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";

export function AuthGuard({ children }: PropsWithChildren) {
	const [, navigate] = useAbsoluteLocation();
	const authState = useCloudStore((s) => s.authState);
	const authError = useCloudStore((s) => s.authError);

	useEffect(() => {
		if (authError) {
			return navigate("/overview");
		}

		if (authState === "unauthenticated") {
			openCloudAuthentication();
		}
	}, [authError, authState]);

	return authState !== "unauthenticated" ? (
		children
	) : (
		<Center flex={1}>
			<Group>
				<Loader size="sm" />
				<Text
					c="bright"
					fz="xl"
					fw={500}
				>
					Redirecting to sign in...
				</Text>
			</Group>
		</Center>
	);
}
