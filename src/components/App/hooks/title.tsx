import { useLayoutEffect } from "react";
import { adapter } from "~/adapter";
import { VIEW_MODES } from "~/constants";
import { useSetting } from "~/hooks/config";
import { useConnection } from "~/hooks/connection";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";

/**
 * Synchronize the title of the window with the current view
 */
export function useTitleSync() {
	const connection = useConnection();
	const activeView = useConfigStore(s => s.activeView);
	const [pinned] = useSetting("behavior", "windowPinned");

	useLayoutEffect(() => {
		const viewInfo = VIEW_MODES[activeView];
		const segments: string[] = [];

		if (activeView === "cloud") {
			segments.push("Surreal Cloud - Surrealist");
		} else {
			if (connection?.name) {
				segments.push(`${connection.name} -`);
			}

			segments.push(`Surrealist ${viewInfo?.name || ""}`);
		}

		if (pinned) {
			segments.push("(Pinned)");
		}

		const title = segments.join(" ");

		adapter.setWindowTitle(title);
		useInterfaceStore.getState().setWindowTitle(title);
	}, [activeView, connection?.name, pinned]);
}