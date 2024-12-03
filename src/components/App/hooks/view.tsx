import { useEventSubscription } from "~/hooks/event";
import { useActiveView } from "~/hooks/routing";
import { NavigateViewEvent } from "~/util/global-events";

export function useViewSync() {
	const [, setActiveView] = useActiveView();

	useEventSubscription(NavigateViewEvent, setActiveView);
}
