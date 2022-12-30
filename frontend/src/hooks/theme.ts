import { useColorScheme } from "@mantine/hooks";
import { useStoreValue } from "~/store";

/**
 * Returns whether the current color scheme is light or not
 */
export function useIsLight() {
	const colorScheme = useStoreValue(state => state.config.theme);
	const defaultScheme = useColorScheme();
	const actualTheme = colorScheme == "automatic" ? defaultScheme : colorScheme;
	
	return actualTheme == 'light';
}