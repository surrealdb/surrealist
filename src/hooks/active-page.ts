import { CONTEXT_VIEW_PAGES } from "~/constants";
import { useAvailablePages, useView } from "~/hooks/connection";
import { useAbsoluteLocation } from "~/hooks/routing";

export interface ActivePage {
	name: string;
	icon: string;
}

/**
 * Returns the display name and icon of the page/view currently open, across
 * connection views, global pages and context views. Used by the mobile dock
 * to render a pill describing the current location.
 */
export function useActivePage(): ActivePage | null {
	const view = useView();
	const pages = useAvailablePages();
	const [location] = useAbsoluteLocation();

	// Connection view (e.g. /c/:connection/query)
	if (view) {
		return { name: view.name, icon: view.icon };
	}

	// Global page (e.g. /, /referrals, /support)
	for (const page of Object.values(pages)) {
		if (location === page.id || page.aliases?.includes(location)) {
			return { name: page.name, icon: page.icon };
		}
	}

	// Context view (e.g. /s/:organization/:context/:view)
	const contextMatch = location.match(/^\/s\/[^/]+\/[^/]+\/([^/?]+)/);

	if (contextMatch) {
		const info = CONTEXT_VIEW_PAGES[contextMatch[1] as keyof typeof CONTEXT_VIEW_PAGES];

		if (info) {
			return { name: info.name, icon: info.icon };
		}
	}

	return null;
}
