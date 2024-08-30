import { useLayoutEffect, useState } from "react";
import { ColorScheme } from "~/types";
import { useSetting } from "./config";
import { useInterfaceStore } from "~/stores/interface";

type Matchable = { matches: boolean };

/**
 * Returns whether the current color scheme is light or not
 */
export function useIsLight() {
	return useInterfaceStore(s => s.colorScheme === "light");
}

/**
 * Compute the final color scheme based on the user's preference and the system's color scheme
 */
export function useThemePreference(): ColorScheme {
	const { setColorScheme } = useInterfaceStore.getState();
	const actualScheme = useInterfaceStore(state => state.colorScheme);

	// Listen for the preferred color scheme
	const [preferredScheme] = useSetting("appearance", "colorScheme");

	// Listen for the system color scheme
	const [systemScheme, setSystemScheme] = useState<ColorScheme>("dark");

	useLayoutEffect(() => {
		const query = window.matchMedia('(prefers-color-scheme: light)');
		const compute = ({ matches }: Matchable) => setSystemScheme(matches ? "light" : "dark");

		compute(query);

		query.addEventListener('change', compute);
	}, []);

	// Compute the final color scheme
	useLayoutEffect(() => {
		setColorScheme(preferredScheme === "auto" ? systemScheme : preferredScheme);
	}, [preferredScheme, setColorScheme, systemScheme]);

	return actualScheme;
}

/**
 * Returns the image URL for the current theme
 */
export function useThemeImage(src: { light: string; dark: string }) {
	const isLight = useIsLight();

	return src[isLight ? "light" : "dark"];
}