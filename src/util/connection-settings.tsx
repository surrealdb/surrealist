import type { ConnectionSettingsTab } from "~/types";

export function connectionSettingsPath(
	connectionId: string,
	tab: ConnectionSettingsTab,
	params?: Record<string, string | undefined>,
) {
	const base = `/c/${connectionId}/settings/${tab}`;

	if (!params) {
		return base;
	}

	const search = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined) {
			search.set(key, value);
		}
	}

	const query = search.toString();

	return query ? `${base}?${query}` : base;
}
