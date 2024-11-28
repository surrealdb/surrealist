import { useIntent } from "~/hooks/url";
import { openHelpAndSupport } from "~/modals/help-and-support";

export function useGlobalModals() {
	useIntent("open-help", openHelpAndSupport);
}
