import { Center } from "@mantine/core";
import { Spinner } from "@surrealdb/ui";
import { type PropsWithChildren, useEffect } from "react";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useAuthentication } from "~/providers/Auth";
import { useCloud } from "~/providers/Cloud";
import { SignInRedirect } from "../SignInRedirect";

export interface AuthGuardProps {
	loading?: boolean;
}

export function AuthGuard({ loading, children }: PropsWithChildren<AuthGuardProps>) {
	const [, navigate] = useAbsoluteLocation();
	const { isAuthenticated, isLoading: isAuthLoading } = useAuthentication();
	const { error } = useCloud();

	useEffect(() => {
		if (error) {
			return navigate("/");
		}
	}, [error]);

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
