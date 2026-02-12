import { MantineThemeOverride } from "@mantine/core";
import { MANTINE_THEME } from "@surrealdb/ui";

const ICON_SIZES: Record<string, number> = {
	xs: 0.5,
	sm: 0.75,
	md: 1,
	lg: 1.25,
	xl: 1.5,
};

export const SURREALIST_THEME: MantineThemeOverride = {
	...MANTINE_THEME,
	components: {
		...MANTINE_THEME.components,
		Drawer: {
			defaultProps: {
				withCloseButton: false,
			},
		},
		Title: {
			defaultProps: {
				fz: "xl",
				c: "bright",
			},
		},
		Checkbox: {
			defaultProps: {
				variant: "gradient",
				styles: {
					icon: {
						width: 9,
						color: "var(--mantine-color-bright)",
					},
				},
			},
		},
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

/**
 * Parse the icon size into a number
 *
 * @param size The size to parse
 * @returns The size as a number
 */
export function getIconSize(size: string | number | undefined): number {
	if (size === undefined) {
		return 1;
	}

	if (typeof size === "number") {
		return size;
	}

	return ICON_SIZES[size] || 1;
}
