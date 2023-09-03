import { useMemo } from "react";
import { ColorScheme, MantineTheme, MantineThemeOverride, rem } from "@mantine/core";

export const LIGHT_BORDER = "light.0";
export const LIGHT_TEXT_1 = "light.3";
export const LIGHT_TEXT_2 = "light.6";
export const LIGHT_TEXT_3 = "light.9";

export type ThemeOption = ColorScheme | "automatic";

const LABEL_STYLE = (theme: MantineTheme) => ({
	label: {
		color: theme.colorScheme == "dark" ? "white" : "light.6",
		fontWeight: 600
	}
});

export function useSurrealistTheme(colorScheme: ColorScheme): MantineThemeOverride {
	return useMemo(
		() => ({
			colorScheme: colorScheme,
			fontFamily: "Montserrat",
			primaryColor: "surreal",
			primaryShade: 5,
			defaultRadius: "md",
			fontSizes: {
				xs: "0.75rem",
				sm: "0.80rem",
				md: "0.85rem",
				lg: "1.00rem",
				xl: "1.20rem",
			},
			headings: {
				fontFamily: "Montserrat",
				sizes: {
					h1: { fontSize: rem(28), fontWeight: 700 },
					h2: { fontSize: rem(20), fontWeight: 600 },
					h3: { fontSize: rem(16), fontWeight: 500 },
				},
			},
			colors: {
				light: [
					"#E8EDF2",
					"#C9D4DE",
					"#ADBACA",
					"#9BA9C6",
					"#8391AE",
					"#67748F",
					"#465671",
					"#384768",
					"#2D3A5D",
					"#212E59",
				],
				surreal: [
					"#ffe2fd",
					"#ffb1eb",
					"#ff7fdc",
					"#ff4ccc",
					"#ff1abe",
					"#e600a4",
					"#b40080",
					"#81005c",
					"#500038",
					"#1f0015",
				],
			},
			defaultGradient: {
				from: "#de3ec9",
				to: "#6861ff",
			},
			components: {
				Modal: {
					defaultProps: {
						centered: true,
					},
					styles: (theme) => ({
						title: {
							color: theme.colorScheme === "dark" ? "white" : "light.6",
							fontSize: "1rem",
						},
					}),
				},
				Menu: {
					defaultProps: {
						withinPortal: true,
					},
				},
				Select: {
					defaultProps: {
						withinPortal: true,
					},
					styles: (theme) => ({
						...LABEL_STYLE(theme),
					}),
				},
				Button: {
					styles: {
						root: {},
					},
				},
				Divider: {
					defaultProps: {
						color: LIGHT_BORDER,
						size: 2,
					},
				},
				Paper: {
					styles: (theme) => ({
						root: {
							color: theme.fn.themeColor(LIGHT_TEXT_2),
						},
					}),
				},
				Input: {
					styles: (theme) => ({
						icon: {
							color: theme.fn.themeColor("light.4"),
						},
						input: {
							"&::placeholder": {
								color: theme.fn.themeColor("light.4"),
							},
						}
					}),
					defaultProps: {
						autoComplete: "off",
						spellCheck: "false",
					},
				},
				TextInput: {
					styles: (theme) => ({
						...LABEL_STYLE(theme),
					}),
				},
				NumberInput: {
					styles: (theme) => ({
						...LABEL_STYLE(theme),
					}),
				},
				Textarea: {
					styles: (theme) => ({
						...LABEL_STYLE(theme),
					}),
				},
				RadioGroup: {
					styles: (theme) => ({
						...LABEL_STYLE(theme),
					}),
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
							fontWeight: 500,
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
					},
					styles: {
						tooltip: {
							backgroundColor: "rgba(255, 255, 255, 0.35)",
							backdropFilter: "blur(4px)",
						},
					},
				},
			},
		}),
		[colorScheme]
	);
}
