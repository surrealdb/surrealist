import { ActionIcon, Box, Button, Divider, Group, MantineProvider, Modal, Paper, ScrollArea, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { MANTINE_THEME } from "~/util/mantine";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { DEFAULT_STATE, EmbedState, Embedder } from "~/components/Embedder";
import { SurrealistLogo } from "~/components/SurrealistLogo";
import { useDebouncedState, useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { iconClose } from "~/util/icons";

export function MiniNewScaffold() {
	const [url, setUrl] = useDebouncedState("", 750);
	const [parsedState, setParsedState] = useState<EmbedState>();
	const [showParse, showParseHandle] = useDisclosure();

	const parseUrl = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		const state = { ...DEFAULT_STATE };
		const value = e.target.value;
		const params = new URL(value).searchParams;

		state.setup = params.get('setup') || state.setup;
		state.query = params.get('query') || state.query;
		state.variables = params.get('variables') || state.variables;
		state.dataset = params.get('dataset') || state.dataset;
		state.orientation = params.get('orientation') as any || state.orientation;

		setParsedState(state);
		showParseHandle.close();
	});

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
							paddingBottom: 50,
							paddingInline: 24
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
								value={parsedState}
								onChangeURL={setUrl}
							/>
							<Stack gap="lg">
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
										referrerPolicy="strict-origin-when-cross-origin"
										style={{
											border: "none",
											borderRadius: 24,
											backgroundColor: "black"
										}}
									/>
								</Box>
								<Divider />
								<Box>
									<Text fw={600} fz="lg" mb={2} c="bright">
										Restore editor
									</Text>
									<Text c="slate.2" mb="sm">
										Optionally paste in an existing embed URL to restore the editor
									</Text>
									<Button
										size="sm"
										color="slate"
										onClick={showParseHandle.open}
									>
										Restore from URL
									</Button>
									<Modal
										opened={showParse}
										onClose={showParseHandle.close}
									>
										<Group>
											<TextInput
												onChange={parseUrl}
												placeholder="Paste your embed URL here"
												flex={1}
											/>
											<ActionIcon
												onClick={showParseHandle.close}
											>
												<Icon path={iconClose} />
											</ActionIcon>
										</Group>
									</Modal>
								</Box>
							</Stack>
						</SimpleGrid>
					</Paper>
				</ScrollArea>
			</MantineProvider>
		</FeatureFlagsProvider>
	);
}