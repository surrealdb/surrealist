import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { CONNECTION_SETTINGS_TABS } from "~/constants";
import type { CloudInstance, CloudOrganization, ConnectionSettingsTab } from "~/types";
import { getConnectionById } from "~/util/connection";

const CLOUD_SETTINGS_TABS: ConnectionSettingsTab[] = ["capabilities", "compute", "backups"];

const ADMIN_CLOUD_SETTINGS_TABS: ConnectionSettingsTab[] = ["capabilities", "compute"];

export function canChangeInstanceVersion(instance: CloudInstance, organisation: CloudOrganization) {
	if (!hasOrganizationRoles(organisation, ORG_ROLES_ADMIN)) {
		return false;
	}

	if (instance.state !== "ready" && instance.state !== "paused") {
		return false;
	}

	return instance.available_versions.length > 0;
}

export function resolveConnectionSettingsTab(
	connectionId: string,
	tab: string,
	isCloud: boolean,
	isAdmin: boolean,
	instance?: CloudInstance,
	organisation?: CloudOrganization,
): ConnectionSettingsTab | null {
	const normalizedTab =
		tab === "configuration" ? "capabilities" : tab === "import-export" ? "data" : tab;

	if (!CONNECTION_SETTINGS_TABS.includes(normalizedTab as ConnectionSettingsTab)) {
		return null;
	}

	const resolved = normalizedTab as ConnectionSettingsTab;
	const connection = getConnectionById(connectionId);

	if (!connection) {
		return null;
	}

	if (resolved === "version") {
		if (
			!isCloud ||
			!instance ||
			!organisation ||
			!canChangeInstanceVersion(instance, organisation)
		) {
			return null;
		}

		return resolved;
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
