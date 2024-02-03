import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";

/**
 * Returns whether the current color scheme is light or not
 */
export function useIsLight() {
	const colorScheme = useConfigStore((s) => s.theme);
	const nativeTheme = useInterfaceStore((s) => s.nativeTheme);
	const actualTheme = colorScheme == "automatic" ? nativeTheme : colorScheme;

	return actualTheme == "light";
}
