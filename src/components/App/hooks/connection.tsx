import { useEffect } from "react";
import { VIEW_MODES } from "~/constants";
import { useConnection } from "~/hooks/connection";
import {
	getOpenConnection,
	openConnection,
} from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { featureFlags } from "~/util/feature-flags";

/**
 * Watch for connection changes and open the connection
 */
export function useConnectionSwitch() {
	const connection = useConnection();
	const activeScreen = useConfigStore((s) => s.activeScreen);
	const activeView = useConfigStore((s) => s.activeView);

	useEffect(() => {
		const open = getOpenConnection();
		const info = VIEW_MODES[activeView];
		const dbScreen = activeScreen === "database";
		const dbView = activeView !== "cloud";
		const dbDiff = connection?.id !== open?.id;

		// Open connection if
		// - a connection is selected
		// - we are on the database screen
		// - we are not on the cloud view
		// - the connection is different from the currently open connection
		if (connection?.id && dbScreen && dbView && dbDiff) {
			openConnection();
		}

		// Switch to query view if the active view is disabled
		if (info?.disabled?.(featureFlags.store)) {
			useConfigStore.getState().setActiveView("query");
		}
	}, [activeScreen, activeView, connection, connection?.id]);
}
