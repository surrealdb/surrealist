import { useEventSubscription } from "~/hooks/event";
import { useConnectionAndView, useConnectionNavigator } from "~/hooks/routing";
import { NavigateConnectionEvent, NavigateViewEvent } from "~/util/global-events";

export function useViewSync() {
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();

	useEventSubscription(NavigateViewEvent, (view) => {
		if (connection) {
			navigateConnection(connection, view);
		}
	});

	// Switching to a different connection (e.g. when a JetBrains deep link
	// asks us to open a `.surql` file in a specific connection) is the same
	// underlying navigation as `useViewSync` performs, just with an explicit
	// id instead of "whatever's in the URL". The connection switch effect
	// in `useConnectionSwitch` will close the previous surreal instance and
	// open the new one once the URL has changed.
	useEventSubscription(NavigateConnectionEvent, ({ id, view }) => {
		navigateConnection(id, view);
	});
}
