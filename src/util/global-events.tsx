import { createEventBus } from "~/hooks/event";
import type { ViewPage } from "~/types";

/**
 * Invoked after a connection has been established
 */
export const ConnectedEvent = createEventBus();

/**
 * Invoked after a connection has been disconnected
 */
export const DisconnectedEvent = createEventBus();

/**
 * Invoked when a database and namespace is activated
 */
export const ActivateDatabaseEvent = createEventBus();

/**
 * Invoked when records in the database have been altered
 */
export const RecordsChangedEvent = createEventBus();

/**
 * Invoked when an interface intent is dispatched
 */
export const IntentEvent = createEventBus();

/**
 * Invoked when the interface should navigate to a new view
 */
export const NavigateViewEvent = createEventBus<ViewPage>();

/**
 * Set the query in the currently active query tab
 */
export const SetQueryEvent = createEventBus<string>();

/**
 * Invoked when a desktop deep link auth callback is received
 */
export const DeepLinkAuthEvent = createEventBus<string>();

/**
 * Invoked when a desktop deep link SurrealDB instance OAuth callback is received
 */
export const DeepLinkSurrealOAuthEvent = createEventBus<string>();
