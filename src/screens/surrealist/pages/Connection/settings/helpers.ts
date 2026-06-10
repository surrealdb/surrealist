import { CONNECTION_SETTINGS_TABS } from "~/constants";
import type { ConnectionSettingsTab } from "~/types";
import { getConnectionById } from "~/util/connection";

const CLOUD_SETTINGS_TABS: ConnectionSettingsTab[] = [
	"configuration",
	"compute",
	"backups",
	"lifecycle",
];

const ADMIN_CLOUD_SETTINGS_TABS: ConnectionSettingsTab[] = [
	"configuration",
	"compute",
	"lifecycle",
];

export function resolveConnectionSettingsTab(
	connectionId: string,
	tab: string,
	isCloud: boolean,
	isAdmin: boolean,
): ConnectionSettingsTab | null {
	if (!CONNECTION_SETTINGS_TABS.includes(tab as ConnectionSettingsTab)) {
		return null;
	}

	const resolved = tab as ConnectionSettingsTab;
	const connection = getConnectionById(connectionId);

	if (!connection) {
		return null;
	}

	if (!isCloud && CLOUD_SETTINGS_TABS.includes(resolved)) {
		return null;
	}

	if (isCloud && !isAdmin && ADMIN_CLOUD_SETTINGS_TABS.includes(resolved)) {
		return null;
	}

	return resolved;
}

export function connectionSettingsRedirect(connectionId: string) {
	return `/c/${connectionId}/settings/general`;
}
