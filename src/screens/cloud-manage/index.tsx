import { Notifications } from "@mantine/notifications";
import { MantineProvider, Stack } from "@mantine/core";
import { useColorScheme, useIsLight } from "~/hooks/theme";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { MANTINE_THEME } from "~/util/mantine";
import { CloudContent } from "./content";

export function CloudManageScreen() {
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

				<Stack
					h="100vh"
					p="md"
					style={{
						backgroundColor: `var(--mantine-color-slate-${isLight ? 0 : 9})`
					}}
				>
					<CloudContent />
				</Stack>
			</MantineProvider>
		</FeatureFlagsProvider>
	);
}