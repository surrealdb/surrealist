import { useLayoutEffect } from "react";
import { useAbsoluteLocation, useSearchParams } from "~/hooks/routing";
import { tagEvent } from "~/util/analytics";
import { handleIntentRequest } from "~/util/intents";
import { AWS_MARKETPLACE_KEY, INVITATION_KEY, REFERRER_KEY } from "~/util/storage";

export function useAppRouter() {
	const [path] = useAbsoluteLocation();
	const { intent, referrer, aws_token, invitation } = useSearchParams();

	// Handle intent requests
	useLayoutEffect(() => {
		if (intent) {
			handleIntentRequest(intent);
		}
	}, [intent]);

	// Cloud referral codes
	useLayoutEffect(() => {
		if (referrer) {
			sessionStorage.setItem(REFERRER_KEY, referrer);
		}
	}, [referrer]);

	// Cloud invitation codes
	useLayoutEffect(() => {
		if (invitation) {
			sessionStorage.setItem(INVITATION_KEY, invitation);
		}
	}, [invitation]);

	// Cloud AWS marketplace token
	useLayoutEffect(() => {
		if (aws_token) {
			sessionStorage.setItem(AWS_MARKETPLACE_KEY, aws_token);
		}
	}, [aws_token]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Page views
	useLayoutEffect(() => {
		void tagEvent("page_view");
	}, [path, tagEvent]);
}
