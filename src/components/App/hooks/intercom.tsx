import { Intercom, update } from "@intercom/messenger-js-sdk";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useCloudProfile } from "~/hooks/cloud";
import { useCloudStore } from "~/stores/cloud";

export function useIntercom() {
	const [location] = useLocation();
	const initialize = useRef(true);

	const profile = useCloudProfile();
	const authState = useCloudStore((s) => s.authState);
	const userId = useCloudStore((s) => s.userId);

	const isReady = authState !== "unknown" && authState !== "loading";

	const metadata = useMemo(() => {
		if (!profile.user_hmac) return {};

		return {
			user_id: userId,
			name: profile.name,
			email: profile.username,
			avatar: profile.picture,
			user_hash: profile.user_hmac,
		};
	}, [profile, userId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Track location change
	useEffect(() => {
		if (!isReady) return;

		if (initialize.current) {
			Intercom({
				app_id: import.meta.env.VITE_INTERCOM_APP_ID,
				z_index: 150,
				...metadata,
			});

			initialize.current = false;
		} else {
			update(metadata);
		}
	}, [isReady, location, metadata]);
}
