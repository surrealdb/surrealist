import { useConfigStore } from "~/stores/config";
import { IntentEvent } from "~/util/global-events";
import {
	type IntentPayload,
	type IntentType,
	getIntentView,
} from "~/util/intents";
import { useEventSubscription } from "./event";

/**
 * Listen to the specified intent and invoke the handler when it is dispatched.
 *
 * @param type The intent type to listen for
 * @param handler The handler to invoke when the intent is dispatched
 */
export function useIntent(
	type: IntentType,
	handler: (payload: IntentPayload) => void,
) {
	useEventSubscription(IntentEvent, (event) => {
		if (event.type === type) {
			handler(event.payload || {});
		}
	});
}

/**
 * Dispatch an intent with the specified payload
 *
 * @param intent The intent type to dispatch
 * @param payload Optional payload
 */
export function dispatchIntent(intent: IntentType, payload?: IntentPayload) {
	const { setActiveView } = useConfigStore.getState();
	const view = getIntentView(intent);

	if (view) {
		setActiveView(view);
	}

	IntentEvent.dispatch({ type: intent, payload });
}
