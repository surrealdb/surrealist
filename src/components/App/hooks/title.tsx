import { useLayoutEffect } from "react";
import { adapter } from "~/adapter";
import { useCloudRoute } from "~/hooks/cloud";
import { useSetting } from "~/hooks/config";
import { useConnection } from "~/hooks/connection";
import { useActiveView } from "~/hooks/routing";
import { useInterfaceStore } from "~/stores/interface";

const NAME =
	import.meta.env.VITE_SURREALIST_PREVIEW === "true" ? "Surrealist Preview" : "Surrealist";

/**
 * Synchronize the title of the window with the current view
 */
export function useTitleSync() {
	const connection = useConnection((c) => c?.name);
	const isCloud = useCloudRoute();
	const [activeView] = useActiveView();
	const [pinned] = useSetting("behavior", "windowPinned");

	useLayoutEffect(() => {
		const segments: string[] = [];

		if (isCloud) {
			segments.push(`Surreal Cloud - ${NAME}`);
		} else {
			if (connection) {
				segments.push(`${connection} -`);
			}

			segments.push(`${NAME} ${activeView?.name || ""}`);
		}

		if (pinned) {
			segments.push("(Pinned)");
		}

		const title = segments.join(" ");

		adapter.setWindowTitle(title);
		useInterfaceStore.getState().setWindowTitle(title);
	}, [activeView, connection, pinned, isCloud]);
}
