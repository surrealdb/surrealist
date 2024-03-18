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

/**
 * Invoked when you need to open the settings modal
 */
export const OpenSettingsDialog = createEventBus<undefined | 'behaviour' | 'appearance' | 'templates' | 'serving' | 'feature-flags' | 'licenses'>();

/**
 * Invoked when you need to open the settings modal
 */
export const OpenConnectionsDialog = createEventBus<undefined | string>();

/**
 * Invoked when you need to open the settings modal
 */
export const OpenNewConnectionDialog = createEventBus();

/**
 * Invoked when you need to open the settings modal
 */
export const OpenHelpDialog = createEventBus();

/**
 * Invoked when you need to open the settings modal
 */
export const OpenDownloadDialog = createEventBus();
