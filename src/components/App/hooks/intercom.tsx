import { Intercom, update } from "@intercom/messenger-js-sdk";
import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { useCloudProfile, useIsAuthLoading } from "~/hooks/cloud";
import { useAuthentication } from "~/providers/Auth";
import { useCloudStore } from "~/stores/cloud";
import { isProduction } from "~/util/environment";

export function useIntercom() {
	const [location] = useLocation();
	const initialize = useRef(true);

	const { user } = useAuthentication();
	const profile = useCloudProfile();
	const isAuthLoading = useIsAuthLoading();
	const userId = useCloudStore((s) => s.userId);

	const isReady = !isAuthLoading;

	const metadata = useMemo(() => {
		if (!profile.user_hmac || !user) return {};

		return {
			user_id: userId,
			name: user.name,
			email: user.email,
			avatar: user.picture,
			user_hash: profile.user_hmac,
		};
	}, [profile, user, userId]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Track location change
	useEffect(() => {
		if (!isReady || !isProduction) return;

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
