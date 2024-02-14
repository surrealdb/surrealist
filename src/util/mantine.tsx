import { createTheme, rem } from "@mantine/core";

export const PRIMARY_COLOR = "surreal.5";

/**
 * Returns the variable for a Mantine color
 * 
 * @param name The name of the color, with optional shade
 * @returns The variable name 
 */
export function themeColor(name: string) {
	let value;
	
	if (name === 'white' || name === 'black') {
		value = name;
	} else if (name.includes('.')) {
		value = name.replace('.', '-');
	} else {
		value = `${name}-6`;
	}

	return `var(--mantine-color-${value})`;
}

/**
 * The Mantine theme configurtation
 */
export const MANTINE_THEME = createTheme({
	fontFamily: `-apple-system, ui-sans-serif, system-ui, Inter, "Helvetica Neue", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
	primaryColor: "surreal",
	primaryShade: 6,
	defaultRadius: "md",
	fontSizes: {
		xs: rem(11),
		sm: rem(12),
		md: rem(13),
		lg: rem(15),
		xl: rem(17),
	},
	headings: {
		sizes: {
			h1: { fontSize: rem(22), fontWeight: '700' },
			h2: { fontSize: rem(20), fontWeight: '600' },
			h3: { fontSize: rem(18), fontWeight: '500' },
		},
	},
	colors: {
		// TODO REPLACE LIGHT WITH SLATE
		light: [
			"#f1f1f3",
			"#d6d6dc",
			"#bbbbc4",
			"#9f9fac",
			"#848495",
			"#6a6a7b",
			"#535360",
			"#3b3b44",
			"#232329",
			"#19191d"
		],
		surreal: [
			"#ffe8fb",
			"#ffcfef",
			"#ff9bda",
			"#ff64c5",
			"#fe38b4",
			"#fe1ca9",
			"#ff09a3",
			"#e4008e",
			"#cc007f",
			"#b3006f",
		],
		slate: [
			"#f1f1f3",
			"#d6d6dc",
			"#bbbbc4",
			"#9f9fac",
			"#848495",
			"#6a6a7b",
			"#535360",
			"#3b3b44",
			"#222226",
			"#19191d"
		]
	},
	defaultGradient: {
		from: "surreal.6",
		to: "#9600FF",
		deg: 90
	},
	components: {
		Modal: {
			defaultProps: {
				centered: true,
			}
		},
		Menu: {
			defaultProps: {
				withinPortal: true,
			},
		},
		Divider: {
			defaultProps: {
				color: 'var(--surrealist-divider-color)',
				size: 1,
			},
		},
		ActionIcon: {
			defaultProps: {
				variant: "subtle",
				color: "slate"
			}
		},
		Input: {
			defaultProps: {
				autoComplete: "off",
				spellCheck: "false",
			},
		},
		Radio: {
			styles: {
				label: {
					display: "block",
				},
			},
		},
		Tabs: {
			styles: {
				tab: {
					fontWeight: 600,
				},
			},
		},
		Switch: {
			styles: {
				root: {
					display: "flex",
				},
			},
		},
		Tooltip: {
			defaultProps: {
				withinPortal: true,
				transitionProps: { transition: "pop" },
				openDelay: 250
			},
			styles: {
				tooltip: {
					color: "white",
					backgroundColor: "var(--surrealist-tooltip-bg)",
					backdropFilter: "blur(4px)",
					webkitBackdropFilter: "blur(4px)",
				},
			},
		},
	}
});