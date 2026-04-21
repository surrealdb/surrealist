import { getCurrentWindow } from "@tauri-apps/api/window";
import { adapter } from "~/adapter";

export const AUTH_BROADCAST_EVENT = "auth-broadcast";

export type AuthBroadcastType = "signin" | "signout";

export interface AuthBroadcast {
	type: AuthBroadcastType;
	source: string;
}

/**
 * Broadcast an Auth0 state transition to other desktop windows.
 *
 * The current window label is included as `source` so the listener can skip
 * its own broadcasts. No-op on non-desktop adapters. Mirrors the
 * `config-updated` pattern used in `src/util/config.tsx`.
 */
export async function broadcastAuthEvent(type: AuthBroadcastType): Promise<void> {
	if (adapter.id !== "desktop") {
		return;
	}

	const window = getCurrentWindow();

	await window.emit(AUTH_BROADCAST_EVENT, {
		type,
		source: window.label,
	} satisfies AuthBroadcast);
}
