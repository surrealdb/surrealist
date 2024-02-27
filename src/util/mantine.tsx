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
	fontFamilyMonospace: `JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`,
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
		surreal: [
			"#ffe8fb",
			"#ffcfef",
			"#ff9bda",
			"#ff64c5",
			"#fe38b4",
			"#fe1ca9",
			"#ff00a0",
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
			"#39393c",
			"#2b2b2f",
			"#222226",
			"#19191D"
		]
	},
	defaultGradient: {
		from: "surreal",
		to: "#9600FF",
		deg: 110
	},
	components: {
		Modal: {
			defaultProps: {
				centered: true,
				withCloseButton: false,
				padding: "lg"
			}
		},
		Overlay: {
			defaultProps: {
				blur: 5
			},
		},
		Menu: {
			defaultProps: {
				withinPortal: true,
			},
		},
		Popover: {
			defaultProps: {
				shadow: "0 6px 12px 2px rgba(0, 0, 0, 0.15)"
			}
		},
		Divider: {
			defaultProps: {
				color: 'var(--surrealist-divider-color)',
				size: 1,
			},
		},
		ActionIcon: {
			defaultProps: {
				variant: "light",
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
		Slider: {
			defaultProps: {
				color: "slate.2"
			}
		},
		Tabs: {
			styles: {
				tab: {
					fontWeight: 600,
				},
			},
		},
		Checkbox: {
			defaultProps: {
				color: "transparent"
			}
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
					WebkitBackdropFilter: "blur(4px)",
				},
			},
		},
		Drawer: {
			defaultProps: {
				withCloseButton: false,
				padding: "lg"
			},
			styles: (theme: any, props: any) => {
				const hasTopRight = props.position === "left" || props.position === "bottom";
				const hasBottomRight = props.position === "left" || props.position === "top";
				const hasTopLeft = props.position === "right" || props.position === "bottom";
				const hasBottomLeft = props.position === "right" || props.position === "top";

				const isHorizontal = props.position === "left" || props.position === "right";
				const isVertical = props.position === "top" || props.position === "bottom";

				return {
					inner: {
						top: isVertical ? 0 : theme.spacing.md,
						bottom: isVertical ? 0 : theme.spacing.md,
						left: isHorizontal ? 0 : theme.spacing.md,
						right: isHorizontal ? 0 : theme.spacing.md,
						width: 'unset'
					},
					content: {
						borderTopRightRadius: hasTopRight ? theme.radius.lg : 0,
						borderBottomRightRadius: hasBottomRight ? theme.radius.lg : 0,
						borderTopLeftRadius: hasTopLeft ? theme.radius.lg : 0,
						borderBottomLeftRadius: hasBottomLeft ? theme.radius.lg : 0,
					}
				};
			}
		}
	}
});