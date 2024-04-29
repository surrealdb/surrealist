import { MantineProvider, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { MANTINE_THEME } from "~/util/mantine";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { Embedder } from "~/components/Embedder";
import { SurrealistLogo } from "~/components/SurrealistLogo";

export function MiniNewScaffold() {
	return (
		<FeatureFlagsProvider>
			<MantineProvider
				withCssVariables
				theme={MANTINE_THEME}
				forceColorScheme="dark"
			>
				<ScrollArea
					h="100vh"
					bg="slate.9"
					viewportProps={{
						style: {
							paddingBottom: 50
						}
					}}
				>
					<Stack py={35}>
						<SurrealistLogo h={32} mx="auto" />
						<Text ta="center" fw={600} fz="xl">
							Embed generator
						</Text>
					</Stack>
					<Paper
						maw={750}
						p="xl"
						mx="auto"
					>
						<Embedder />
					</Paper>
				</ScrollArea>
			</MantineProvider>
		</FeatureFlagsProvider>
	);
}