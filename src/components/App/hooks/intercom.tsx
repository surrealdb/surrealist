import { Intercom } from "@intercom/messenger-js-sdk";
import { useCloudStore } from "~/stores/cloud";

export function useIntercom() {
	const authState = useCloudStore((s) => s.authState);
	const profile = useCloudStore((s) => s.profile);

	const isReady = authState !== "unknown" && authState !== "loading";

	if (isReady && !import.meta.env.DEV) {
		Intercom({
			app_id: import.meta.env.VITE_INTERCOM_APP_ID,
			user_id: profile.username || undefined,
			name: profile.name || undefined,
			avatar: profile.picture || undefined,
		});
	}
}
