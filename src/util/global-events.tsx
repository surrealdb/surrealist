import { createEventBus } from "~/hooks/event";

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