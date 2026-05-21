import { useAuth0 } from "@auth0/auth0-react";
import type { Event } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { useAbsoluteLocation } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { AUTH_BROADCAST_EVENT, type AuthBroadcast } from "~/util/auth-broadcast";

/**
 * Hook to synchronize Auth0 state across multiple Desktop windows.
 */
export function useAuthWindowSync() {
	const { getAccessTokenSilently, logout } = useAuth0();
	const [, navigate] = useAbsoluteLocation();

	const handleBroadcast = useStable(async (payload: AuthBroadcast) => {
		try {
			if (payload.type === "signin") {
				await getAccessTokenSilently();
			} else if (payload.type === "signout") {
				navigate("/");
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
