import {
	Checkbox,
	Drawer,
	InputBase,
	MantineThemeOverride,
	MultiSelect,
	NumberInput,
	Paper,
	PasswordInput,
	Select,
	Switch,
	TagsInput,
	Textarea,
	TextInput,
	Title,
} from "@mantine/core";
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
		Checkbox: Checkbox.extend({
			defaultProps: {
				variant: "gradient",
			},
		}),
		Paper: Paper.extend({
			defaultProps: {
				variant: "filled",
			},
		}),
		Switch: Switch.extend({
			defaultProps: {
				variant: "gradient",
				withThumbIndicator: false,
			},
		}),
		Select: Select.extend({
			defaultProps: {
				variant: "filled",
			},
		}),
		MultiSelect: MultiSelect.extend({
			defaultProps: {
				variant: "filled",
			},
		}),
		InputBase: InputBase.extend({
			defaultProps: {
				variant: "filled",
			},
		}),
		TextInput: TextInput.extend({
			defaultProps: {
				spellCheck: false,
				variant: "filled",
			},
		}),
		NumberInput: NumberInput.extend({
			defaultProps: {
				spellCheck: false,
				variant: "filled",
			},
		}),
		PasswordInput: PasswordInput.extend({
			defaultProps: {
				variant: "filled",
			},
		}),
		Textarea: Textarea.extend({
			defaultProps: {
				variant: "filled",
			},
		}),
		TagsInput: TagsInput.extend({
			defaultProps: {
				variant: "filled",
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
