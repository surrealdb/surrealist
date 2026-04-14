import { Center, Loader } from "@mantine/core";
import type { PropsWithChildren } from "react";
import { AuthGuard, type AuthGuardProps } from "~/components/AuthGuard";
import { useCloudStore } from "~/stores/cloud";

export interface CloudGuardProps extends AuthGuardProps {}

export function CloudGuard({ children, ...rest }: PropsWithChildren<CloudGuardProps>) {
	const cloudSessionActive = useCloudStore((s) => s.cloudSessionActive);

	return (
		<AuthGuard {...rest}>
			{cloudSessionActive ? (
				children
			) : (
				<Center flex={1}>
					<Loader size="lg" />
				</Center>
			)}
		</AuthGuard>
	);
}
