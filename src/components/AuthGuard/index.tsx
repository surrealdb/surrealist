import { Center, Loader } from "@mantine/core";
import { type PropsWithChildren, useEffect } from "react";
import { Redirect } from "wouter";
import { useCloudAuth } from "~/hooks/cloud-auth";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useCloudStore } from "~/stores/cloud";

export interface AuthGuardProps {
	redirect?: string;
	loading?: boolean;
}

export function AuthGuard({ redirect, loading, children }: PropsWithChildren<AuthGuardProps>) {
	const [, navigate] = useAbsoluteLocation();
	const { signIn } = useCloudAuth();
	const authState = useCloudStore((s) => s.authState);
	const authError = useCloudStore((s) => s.authError);

	useEffect(() => {
		if (authError) {
			return navigate("/overview");
		}

		if (authState === "unauthenticated") {
			signIn();
		}
	}, [authError, authState, signIn]);

	return authState === "authenticated" && !loading ? (
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
