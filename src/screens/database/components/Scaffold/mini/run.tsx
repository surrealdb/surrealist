import { Notifications } from "@mantine/notifications";
import { Box, MantineProvider } from "@mantine/core";
import { MANTINE_THEME } from "~/util/mantine";
import { useColorScheme, useIsLight } from "~/hooks/theme";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import QueryView from "~/screens/database/views/query/QueryView";

export function MiniRunScaffold() {
	const colorScheme = useColorScheme();
	const isLight = useIsLight();

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
					p="md"
					style={{
						backgroundColor: `var(--mantine-color-slate-${isLight ? 0 : 9})`
					}}
				>
					<QueryView />
				</Box>
			</MantineProvider>
		</FeatureFlagsProvider>
	);
}