import { Center, Loader } from "@mantine/core";
import { type PropsWithChildren, useEffect } from "react";
import { useIsAuthenticated, useIsAuthLoading } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useAuthentication } from "~/providers/Auth";
import { useCloudStore } from "~/stores/cloud";

export interface AuthGuardProps {
	loading?: boolean;
}

export function AuthGuard({ loading, children }: PropsWithChildren<AuthGuardProps>) {
	const [, navigate] = useAbsoluteLocation();
	const { signIn } = useAuthentication();
	const isAuthenticated = useIsAuthenticated();
	const isAuthLoading = useIsAuthLoading();
	const authError = useCloudStore((s) => s.authError);

	const isReady = isAuthenticated && !isAuthLoading && !loading;

	useEffect(() => {
		if (authError) {
			return navigate("/overview");
		}

		if (!isAuthenticated && !isAuthLoading) {
			signIn();
		}
	}, [authError, isAuthenticated, isAuthLoading, signIn]);

	return isReady ? (
		children
	) : (
		<Center flex={1}>
			<Loader size="lg" />
		</Center>
	);
}
