import { useLayoutEffect } from "react";
import { useSetting } from "~/hooks/config";

/**
 * Synchronize appearance related settings that need to be applied
 * to the document root element.
 */
export function useAppearanceSettings() {
	const [disableAnimations] = useSetting("appearance", "disableAnimations");

	useLayoutEffect(() => {
		document.documentElement.toggleAttribute("data-reduce-motion", disableAnimations);
	}, [disableAnimations]);
}
