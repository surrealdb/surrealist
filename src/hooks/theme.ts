import { useInterfaceStore } from "~/stores/interface";

/**
 * Returns the color scheme currently in use
 */
export function useColorScheme() {
	return useInterfaceStore(s => s.colorScheme);
}

/**
 * Returns whether the current color scheme is light or not
 */
export function useIsLight() {
	return useColorScheme() === "light";
}
