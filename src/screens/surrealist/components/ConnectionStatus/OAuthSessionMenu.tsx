import { Loader, Menu, Text } from "@mantine/core";
import { Icon, iconClose, iconRefresh } from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import {
	closeConnection,
	openConnection,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { getConnectionById } from "~/util/connection";
import { showErrorNotification } from "~/util/helpers";
import {
	interactiveOAuthSignIn,
	isOAuthSignInCancelled,
	OAuthConnectError,
} from "~/util/oauth-connect";
import { getOAuthSessionExpiryLines } from "~/util/oauth-session";
import { clearOAuthSession } from "~/util/surreal-oauth";

interface OAuthSessionSectionProps {
	connectionId: string;
}

export function OAuthSessionSection({ connectionId }: OAuthSessionSectionProps) {
	const [busy, setBusy] = useState(false);

	const authentication = useConnection((c) => c?.authentication);

	const expiry = useMemo(
		() => (authentication ? getOAuthSessionExpiryLines(authentication) : null),
		[authentication],
	);

	const signOutOAuth = useStable(async () => {
		const connection = getConnectionById(connectionId);

		if (!connection || connection.authentication.mode !== "oauth") {
			return;
		}

		const { updateConnection } = useConfigStore.getState();
		const cleared = clearOAuthSession(connection.authentication);

		updateConnection({
			...connection,
			authentication: cleared,
		});

		if (useDatabaseStore.getState().currentState === "connected") {
			await closeConnection();
		}
	});

	const reauthenticateOAuth = useStable(async () => {
		const connection = getConnectionById(connectionId);

		if (!connection || connection.authentication.mode !== "oauth") {
			return;
		}

		const wasConnected = useDatabaseStore.getState().currentState === "connected";
		const { updateConnection } = useConfigStore.getState();

		setBusy(true);

		try {
			const clearedAuth = clearOAuthSession(connection.authentication);
			const cleared = {
				...connection,
				authentication: clearedAuth,
			};

			updateConnection(cleared);

			if (wasConnected) {
				await closeConnection();
			}

			const auth = await interactiveOAuthSignIn(clearedAuth);
			const updated = {
				...cleared,
				authentication: auth,
			};

			updateConnection(updated);

			if (wasConnected) {
				await openConnection({ connection: updated, isRetry: true });
			}
		} catch (err: unknown) {
			if (!isOAuthSignInCancelled(err)) {
				const message =
					err instanceof OAuthConnectError
						? err.message
						: err instanceof Error
							? err.message
							: "OAuth sign-in failed";

				showErrorNotification({
					title: "OAuth sign-in failed",
					content: message,
				});
			}
		} finally {
			setBusy(false);
		}
	});

	if (!authentication || authentication.mode !== "oauth" || !expiry) {
		return null;
	}

	const canSignOut = expiry.hasSession || expiry.hasRefreshToken;

	return (
		<>
			<Menu.Label mt="sm">OAuth Session</Menu.Label>
			<Text
				px="sm"
				size="xs"
				className="selectable"
			>
				Session: {expiry.session}
			</Text>
			{expiry.refresh != null && (
				<Text
					px="sm"
					pb="xs"
					size="xs"
					className="selectable"
				>
					Refresh: {expiry.refresh}
				</Text>
			)}
			<Menu.Item
				leftSection={<Icon path={iconClose} />}
				disabled={!canSignOut || busy}
				onClick={signOutOAuth}
			>
				Sign out
			</Menu.Item>
			<Menu.Item
				leftSection={busy ? <Loader size={14} /> : <Icon path={iconRefresh} />}
				disabled={busy}
				onClick={reauthenticateOAuth}
			>
				Sign in again
			</Menu.Item>
		</>
	);
}
