import { Box, MantineProvider, Paper, ScrollArea, SimpleGrid, Stack, Text } from "@mantine/core";
import { MANTINE_THEME } from "~/util/mantine";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { Embedder } from "~/components/Embedder";
import { SurrealistLogo } from "~/components/SurrealistLogo";
import { useDebouncedState } from "@mantine/hooks";

export function MiniNewScaffold() {
	const [url, setUrl] = useDebouncedState("", 750);

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
						maw={1500}
						p="xl"
						mx="auto"
					>
						<SimpleGrid cols={2} spacing={52}>
							<Embedder
								onChange={setUrl}
							/>
							<Box>
								<Text fw={600} fz="lg" mb={2} c="bright">
									Embed Preview
								</Text>
								<Text c="slate.2" mb="lg">
									The preview will automatically reload after making changes
								</Text>
								<iframe
									width="100%"
									height="500"
									src={url}
									title="Surrealist Mini"
									allow="clipboard-write;"
									referrerPolicy="strict-origin-when-cross-origin"
									allowTransparency
									style={{
										border: "none",
										borderRadius: 24,
										backgroundColor: "black"
									}}
								/>
							</Box>
						</SimpleGrid>
					</Paper>
				</ScrollArea>
			</MantineProvider>
		</FeatureFlagsProvider>
	);
}