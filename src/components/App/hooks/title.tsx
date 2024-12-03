import { useLayoutEffect } from "react";
import { useRoute } from "wouter";
import { adapter } from "~/adapter";
import { VIEW_MODES } from "~/constants";
import { useCloudRoute } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useConnection } from "~/hooks/connection";
import { useActiveView } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";

const NAME =
	import.meta.env.VITE_SURREALIST_PREVIEW === "true" ? "Surrealist Preview" : "Surrealist";

/**
 * Synchronize the title of the window with the current view
 */
export function useTitleSync() {
	const connection = useConnection();
	const isCloud = useCloudRoute();
	const [activeView] = useActiveView();
	const [pinned] = useSetting("behavior", "windowPinned");

	useLayoutEffect(() => {
		const segments: string[] = [];

		if (isCloud) {
			segments.push(`Surreal Cloud - ${NAME}`);
		} else {
			if (connection?.name) {
				segments.push(`${connection.name} -`);
			}

			segments.push(`${NAME} ${activeView?.name || ""}`);
		}

		if (pinned) {
			segments.push("(Pinned)");
		}

		const title = segments.join(" ");

		adapter.setWindowTitle(title);
		useInterfaceStore.getState().setWindowTitle(title);
	}, [activeView, connection?.name, pinned, isCloud]);
}
