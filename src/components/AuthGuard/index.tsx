import { Center, Loader } from "@mantine/core";
import { type PropsWithChildren, useEffect } from "react";
import { Redirect } from "wouter";
import { useIsAuthenticated, useIsAuthLoading } from "~/hooks/cloud";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useAuthentication } from "~/providers/Auth";
import { useCloudStore } from "~/stores/cloud";

export interface AuthGuardProps {
	redirect?: string;
	loading?: boolean;
}

export function AuthGuard({ redirect, loading, children }: PropsWithChildren<AuthGuardProps>) {
	const [, navigate] = useAbsoluteLocation();
	const { signIn } = useAuthentication();
	const isAuthenticated = useIsAuthenticated();
	const isAuthLoading = useIsAuthLoading();
	const authError = useCloudStore((s) => s.authError);

	useEffect(() => {
		if (authError) {
			return navigate("/overview");
		}

		if (!isAuthenticated && !isAuthLoading) {
			signIn();
		}
	}, [authError, isAuthenticated, isAuthLoading, signIn]);

	return isAuthenticated && !loading ? (
		redirect ? (
			<Redirect to={redirect} />
		) : (
			children
		)
	) : (
		<Center flex={1}>
			<Loader size="lg" />
		</Center>
	);
}
