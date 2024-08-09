import { useLayoutEffect } from "react";
import { VIEW_MODES } from "~/constants";
import { useConnection } from "~/hooks/connection";
import { isConnected, openConnection } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { featureFlags } from "~/util/feature-flags";

/**
 * Watch for connection changes and open the connection
 *
 * TODO deprecated
 */
export function useConnectionSwitch() {
	const connection = useConnection();
	const activeScreen = useConfigStore(s => s.activeScreen);
	const activeView = useConfigStore(s => s.activeView);

	useLayoutEffect(() => {
		const info = VIEW_MODES[activeView];
		const dbScreen = activeScreen === "database";
		const dbView = activeView !== "cloud";

		if (connection?.id && dbScreen && dbView && !isConnected()) {
			openConnection();
		}

		if (info?.disabled?.(featureFlags.store)) {
			useConfigStore.getState().setActiveView("query");
		}
	}, [activeScreen, activeView, connection?.id]);
}