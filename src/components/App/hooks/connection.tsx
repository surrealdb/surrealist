import { useEffect } from "react";
import { useCloudRoute } from "~/hooks/cloud";
import { useConnection } from "~/hooks/connection";
import { useActiveView } from "~/hooks/routing";
import { getOpenConnection, openConnection } from "~/screens/database/connection/connection";
import { featureFlags } from "~/util/feature-flags";

/**
 * Watch for connection changes and open the connection
 */
export function useConnectionSwitch() {
	const connection = useConnection();
	const isCloud = useCloudRoute();
	const [activeView, setActiveView] = useActiveView();

	useEffect(() => {
		const open = getOpenConnection();
		const dbDiff = connection?.id !== open?.id;

		// Open connection if
		// - a connection is selected
		// - we are not on a cloud page
		// - the connection is different from the currently open connection
		if (connection?.id && !isCloud && dbDiff) {
			openConnection();
		}

		// Switch to query view if the active view is disabled
		if (activeView?.disabled?.(featureFlags.store)) {
			setActiveView("query");
		}
	}, [isCloud, activeView, connection, connection?.id]);
}
