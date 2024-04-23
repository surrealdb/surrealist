import { ActionIcon, Checkbox, Divider, Drawer, Modal, Overlay, Popover, Radio, Select, Slider, Switch, Tabs, TagsInput, Tooltip, createTheme, rem } from "@mantine/core";

export const PRIMARY_COLOR = "surreal.5";

const ICON_SIZES: Record<string, number> = {
	xs: 0.5,
	sm: 0.75,
	md: 1,
	lg: 1.25,
	xl: 1.5,
};

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
 * Parse the icon size into a number
 *
 * @param size The size to parse
 * @returns The size as a number
 */
export function getIconSize(size: string | number | undefined): number {
	if (size === undefined) {
		return 1;
	} else if (typeof size === 'number') {
		return size;
	} else {
		return ICON_SIZES[size] || 1;
	}
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
		xs: rem(10),
		sm: rem(11),
		md: rem(12),
		lg: rem(14),
		xl: rem(16),
	},
	headings: {
		sizes: {
			h1: { fontSize: rem(22), fontWeight: '700' },
			h2: { fontSize: rem(20), fontWeight: '600' },
			h3: { fontSize: rem(18), fontWeight: '500' },
		},
	},
	spacing: {
		xs: rem(6),
		sm: rem(9),
		md: rem(12),
		lg: rem(16),
		xl: rem(20),
	},
	radius: {
		xs: rem(7),
		sm: rem(9),
		md: rem(11),
		lg: rem(15),
		xl: rem(19),
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
		Modal: Modal.extend({
			defaultProps: {
				centered: true,
				withCloseButton: false,
				padding: 24
			}
		}),
		Overlay: Overlay.extend({
			defaultProps: {
				blur: 5
			},
		}),
		Popover: Popover.extend({
			defaultProps: {
				shadow: "0 6px 12px 2px rgba(0, 0, 0, 0.15)",
			}
		}),
		Divider: Divider.extend({
			defaultProps: {
				color: 'var(--surrealist-divider-color)',
				size: 1,
			},
		}),
		ActionIcon: ActionIcon.extend({
			defaultProps: {
				variant: "light",
				color: "slate",
				radius: "xs"
			}
		}),
		Select: Select.extend({
			defaultProps: {
				allowDeselect: false
			}
		}),
		Radio: Radio.extend({
			styles: {
				label: {
					display: "block",
				},
			},
		}),
		Slider: Slider.extend({
			defaultProps: {
				color: "slate.2"
			}
		}),
		Tabs: Tabs.extend({
			defaultProps: {
				variant: "pills",
			},
			styles: {
				tab: {
					fontWeight: 600,
					minHeight: 30
				},
			},
		}),
		Checkbox: Checkbox.extend({
			defaultProps: {
				color: "transparent",
				radius: 5
			}
		}),
		Switch: Switch.extend({
			styles: {
				root: {
					display: "flex",
				},
			},
		}),
		TagsInput: TagsInput.extend({
			styles: {
				pill: {
					backgroundColor: "var(--mantine-color-surreal-6)",
				},
				input: {
					display: "flex",
				}
			}
		}),
		Tooltip: Tooltip.extend({
			defaultProps: {
				transitionProps: { transition: "pop" },
				radius: "xs",
				p: "sm"
			},
			styles: {
				tooltip: {
					color: "white",
					padding: 4,
					backgroundColor: "rgba(0, 0, 0, 0.7)",
					backdropFilter: "blur(4px)",
					WebkitBackdropFilter: "blur(4px)",
				},
			},
		}),
		Drawer: Drawer.extend({
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
		})
	}
});