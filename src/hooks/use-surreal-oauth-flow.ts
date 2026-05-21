import { useState } from "react";
import { useStable } from "~/hooks/stable";
import type { Authentication } from "~/types";
import { runSurrealOAuthSignIn, SurrealOAuthFlowError } from "~/util/surreal-oauth-flow";

export { SurrealOAuthFlowError };

export function useSurrealOAuthFlow() {
	const [running, setRunning] = useState(false);

	const signIn = useStable(async (auth: Authentication) => {
		setRunning(true);

		try {
			return await runSurrealOAuthSignIn(auth);
		} finally {
			setRunning(false);
		}
	});

	return { signIn, running };
}
