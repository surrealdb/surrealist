import { useIntent } from "~/hooks/routing";
import { openHelpAndSupport } from "~/modals/help-and-support";

export function useGlobalModals() {
	useIntent("open-help", openHelpAndSupport);
}
