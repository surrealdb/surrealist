import { trackEvent } from "@intercom/messenger-js-sdk";
import posthog from "posthog-js";

export function captureMetric(name: string, payload?: any) {
	posthog.capture(name, payload);
	trackEvent(name, payload);
}
