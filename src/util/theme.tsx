import { ColorScheme, MantineThemeOverride } from "@mantine/core";

import { useMemo } from "react";

export const LIGHT_BORDER = 'light.0';
export const LIGHT_TEXT_1 = 'light.3';
export const LIGHT_TEXT_2 = 'light.6';
export const LIGHT_TEXT_3 = 'light.9';

export type ThemeOption = ColorScheme | "automatic"

export function useSurrealistTheme(colorScheme: ColorScheme): MantineThemeOverride {
	return useMemo(() => ({
		colorScheme: colorScheme,
		fontFamily: 'Montserrat',
		primaryColor: 'surreal',
		primaryShade: 5,
		defaultRadius: 'md',
		fontSizes: {
			xs: 12,
			sm: 13,
			md: 14,
			lg: 16,
			xl: 18
		},
		headings: {
			fontFamily: 'Montserrat',
			sizes: {
				h1: { fontSize: 28, fontWeight: 700 },
				h2: { fontSize: 20, fontWeight: 600 },
				h3: { fontSize: 16, fontWeight: 500 },
			}
		},
		colors: {
			light: [ '#E8EDF2', '#C9D4DE', '#ADBACA', '#9BA9C6', '#8391AE', '#67748F', '#465671', '#384768', '#2D3A5D', '#212E59' ],
			surreal: [ '#ffe2fd', '#ffb1eb', '#ff7fdc', '#ff4ccc', '#ff1abe', '#e600a4', '#b40080', '#81005c', '#500038', '#1f0015' ]
		},
		defaultGradient: {
			from: '#de3ec9',
			to: '#6861ff'
		},
		components: {
			Modal: {
				defaultProps: {
					centered: true,
					exitTransitionDuration: 150,
					overlayColor: colorScheme == 'light' ? '#0c0a12' : '#090612',
					overlayBlur: 1
				}
			},
			Menu: {
				defaultProps: {
					withinPortal: true
				}
			},
			Select: {
				defaultProps: {
					withinPortal: true
				}
			},
			Button: {
				styles: {
					root: {}
				}
			},
			Divider: {
				defaultProps: {
					color: LIGHT_BORDER,
					size: 2
				}
			},
			Paper: {
				styles: (theme) => ({
					root: {
						color: theme.fn.themeColor(LIGHT_TEXT_2),
					}
				})
			},
			Input: {
				styles: (theme) => ({
					icon: {
						color: theme.fn.themeColor('light.4')
					},
					input: {
						'&::placeholder': {
							color: theme.fn.themeColor('light.4')
						}
					}
				}),
				defaultProps: {
					autoComplete: 'off',
					spellCheck: 'false'
				}
			},
			Radio: {
				styles: {
					label: {
						display: 'block'
					}
				}
			},
			Tabs: {
				styles: {
					tab: {
						fontWeight: 500
					}
				}
			},
			Switch: {
				styles: {
					root: {
						display: 'flex'
					}
				}
			},
			Tooltip: {
				defaultProps: {
					withinPortal: true
				},
				styles: (theme, params) => ({
					tooltip: {
						backgroundColor: 'rgba(255, 255, 255, 0.35)',
						backdropFilter: 'blur(4px)',
					}	
				})
			}
		}
	}), [colorScheme]);	
}