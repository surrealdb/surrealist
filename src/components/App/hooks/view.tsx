import { useEventSubscription } from "~/hooks/event";
import { useConnectionAndView, useConnectionNavigator } from "~/hooks/routing";
import { NavigateViewEvent } from "~/util/global-events";

export function useViewSync() {
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();

	useEventSubscription(NavigateViewEvent, (view) => {
		if (connection) {
			navigateConnection(connection, view);
		}
	});
}
