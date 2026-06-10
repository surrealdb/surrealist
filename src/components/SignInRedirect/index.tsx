import { Center } from "@mantine/core";
import { Spinner } from "@surrealdb/ui";
import { useEffect } from "react";
import { useAuthentication } from "~/providers/Auth";

export function SignInRedirect() {
	const { signIn } = useAuthentication();

	useEffect(() => {
		signIn({ redirect: true });
	}, [signIn]);

	return (
		<Center
			h="100%"
			flex={1}
		>
			<Spinner />
		</Center>
	);
}
