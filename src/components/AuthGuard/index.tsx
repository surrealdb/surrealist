import { Center } from "@mantine/core";
import { Spinner } from "@surrealdb/ui";
import { type PropsWithChildren, useEffect } from "react";
import { useIsAuthenticated, useIsAuthLoading } from "~/hooks/auth";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";
import { SignInRedirect } from "../SignInRedirect";

export interface AuthGuardProps {
	loading?: boolean;
}

export function AuthGuard({ loading, children }: PropsWithChildren<AuthGuardProps>) {
	const [, navigate] = useAbsoluteLocation();
	const isAuthenticated = useIsAuthenticated();
	const isAuthLoading = useIsAuthLoading();
	const authError = useCloudStore((s) => s.authError);

	useEffect(() => {
		if (authError) {
			return navigate("/overview");
		}
	}, [authError]);

	return isAuthLoading || loading ? (
		<Center flex={1}>
			<Spinner />
		</Center>
	) : isAuthenticated ? (
		children
	) : (
		<SignInRedirect />
	);
}
