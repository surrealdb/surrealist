import { MantineThemeOverride } from "@mantine/core";
import { MANTINE_THEME } from "@surrealdb/ui";

export const SURREALIST_THEME: MantineThemeOverride = {
	...MANTINE_THEME,
	components: {
		...MANTINE_THEME.components,
		Drawer: {
			defaultProps: {
				withCloseButton: false,
			},
		},
	},
};
