import { createEventBus } from "~/hooks/event";
import type { Intent, IntentType } from "./intents";

/**
 * Invoked after a connection has been established
 */
export const ConnectedEvent = createEventBus();

/**
 * Invoked after a connection has been disconnected
 */
export const DisconnectedEvent = createEventBus();

/**
 * Invoked when records in the database have been altered
 */
export const RecordsChangedEvent = createEventBus();

/**
 * Invoked when an interface intent is dispatched
 */
export const IntentEvent = createEventBus<Intent<IntentType>>();

/**
 * Invoked when the cloud account has been authenticated
 */
export const CloudAuthEvent = createEventBus();

/**
 * Invoked when the cloud account has expired
 */
export const CloudExpiredEvent = createEventBus();
