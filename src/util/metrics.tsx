import posthog from "posthog-js";
import { trackEvent } from "@intercom/messenger-js-sdk";

export function captureMetric(name: string, payload?: any) {
	posthog.capture(name, payload);
	trackEvent(name, payload);
}
