import { useAuth0 } from "@auth0/auth0-react";
import type { Event } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { AUTH_BROADCAST_EVENT, type AuthBroadcast } from "~/util/auth-broadcast";

/**
 * Desktop: keep Auth0 React state in sync across windows.
 *
 * - On `signin`: the originating window has just populated the shared
 *   Auth0 localStorage cache. Calling `getAccessTokenSilently` here lets
 *   `useAuth0` re-read the cache so `isAuthenticated`/`user` flip to true,
 *   which in turn drives `CloudProvider.acquireSession`.
 * - On `signout`: navigate to a public route first so `AuthGuard` does not
 *   immediately render `<SignInRedirect />` and trigger a fresh Auth0 login
 *   tab once `isAuthenticated` flips to false. Then clear the local Auth0
 *   React state without contacting Auth0 (the originating window already
 *   cleared the cache and is opening the Auth0 logout page itself).
 *
 * Broadcasts originating from the current window are ignored so that the
 * source window's own signout flow is the only one that opens the Auth0
 * signout page in the user's browser.
 *
 * No-op on non-desktop adapters.
 */
export function useAuthWindowSync() {
	const { getAccessTokenSilently, logout } = useAuth0();
	const [, navigate] = useAbsoluteLocation();

	const handleBroadcast = useStable(async (payload: AuthBroadcast) => {
		try {
			if (payload.type === "signin") {
				await getAccessTokenSilently();
			} else if (payload.type === "signout") {
				navigate("/overview");
				await logout({ openUrl: false });
			}
		} catch (err) {
			adapter.warn("Auth", `Failed to apply auth broadcast: ${JSON.stringify(err)}`);
		}
	});

	useEffect(() => {
		if (adapter.id !== "desktop") {
			return;
		}

		const currentLabel = getCurrentWindow().label;

		const unlisten = getCurrentWindow().listen(
			AUTH_BROADCAST_EVENT,
			(event: Event<AuthBroadcast>) => {
				if (event.payload.source === currentLabel) {
					return;
				}

				handleBroadcast(event.payload);
			},
		);

		return () => {
			void unlisten.then((fn) => fn());
		};
	}, []);
}
