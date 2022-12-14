import { useStoreValue } from "~/store";

/**
 * Returns whether the current color scheme is light or not
 */
export function useIsLight() {
	return useStoreValue(state => state.colorScheme) == 'light';
}