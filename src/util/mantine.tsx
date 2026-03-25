import { Alert, Drawer, type MantineThemeOverride, Title } from "@mantine/core";
import { MANTINE_THEME } from "@surrealdb/ui";

export const SURREALIST_THEME: MantineThemeOverride = {
	...MANTINE_THEME,
	components: {
		...MANTINE_THEME.components,
		Alert: Alert.extend({
			defaultProps: {
				variant: "light",
			},
		}),
		Drawer: Drawer.extend({
			defaultProps: {
				withCloseButton: false,
			},
		}),
		Title: Title.extend({
			defaultProps: {
				fz: "xl",
				c: "bright",
			},
		}),
	},
};

/**
 * Returns the variable for a Mantine color
 *
 * @param name The name of the color, with optional shade
 * @returns The variable name
 */
export function themeColor(name: string) {
	let value: string;

	if (name === "white" || name === "black") {
		value = name;
	} else if (name.includes(".")) {
		value = name.replace(".", "-");
	} else {
		value = `${name}-6`;
	}

	return `var(--mantine-color-${value})`;
}
