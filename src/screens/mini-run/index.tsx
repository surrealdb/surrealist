import { Notifications } from "@mantine/notifications";
import { Box, MantineProvider } from "@mantine/core";
import { MANTINE_THEME } from "~/util/mantine";
import { useColorScheme, useIsLight } from "~/hooks/theme";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import QueryView from "~/screens/database/views/query/QueryView";
import { adapter } from "~/adapter";
import { MiniAdapter } from "~/adapter/mini";

export function MiniRunScreen() {
	const colorScheme = useColorScheme();
	const isLight = useIsLight();

	const { hideBorder, transparent } = (adapter as MiniAdapter);

	return (
		<FeatureFlagsProvider>
			<MantineProvider
				withCssVariables
				theme={MANTINE_THEME}
				forceColorScheme={colorScheme}
			>
				<Notifications />

				<Box
					h="100vh"
					p={hideBorder ? 0 : "md"}
					style={{
						backgroundColor: transparent
							? undefined
							: `var(--mantine-color-slate-${isLight ? 0 : 9})`
					}}
				>
					<QueryView />
				</Box>
			</MantineProvider>
		</FeatureFlagsProvider>
	);
}