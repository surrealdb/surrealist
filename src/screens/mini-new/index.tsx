import { ActionIcon, Box, Button, Divider, Group, Image, MantineProvider, Modal, Paper, ScrollArea, SimpleGrid, Stack, Text, TextInput } from "@mantine/core";
import { MANTINE_THEME } from "~/util/mantine";
import { FeatureFlagsProvider } from "~/providers/FeatureFlags";
import { DEFAULT_STATE, EmbedState, Embedder } from "~/components/Embedder";
import { useDebouncedState, useDisclosure } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { iconClose } from "~/util/icons";
import { useLogoUrl } from "~/hooks/brand";

export function MiniNewScreen() {
	const logoUrl = useLogoUrl();
	const [url, setUrl] = useDebouncedState("", 750);
	const [parsedState, setParsedState] = useState<EmbedState>();
	const [showParse, showParseHandle] = useDisclosure();

	const frame = useRef<HTMLIFrameElement>(null);

	const parseUrl = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		const state = { ...DEFAULT_STATE };
		const value = e.target.value;
		const params = new URL(value).searchParams;

		state.setup = params.get('setup') || state.setup;
		state.query = params.get('query') || state.query;
		state.variables = params.get('variables') || state.variables;
		state.dataset = params.get('dataset') || state.dataset;
		state.orientation = params.get('orientation') as any || state.orientation;
		state.transparent = params.has('transparent') || state.transparent;

		setParsedState(state);
		showParseHandle.close();
	});

	useEffect(() => {
		(window as any).FRAME = frame.current?.contentWindow;
	}, []);

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
						<Image src={logoUrl} w={250} mx="auto" />
						<Text ta="center" fw={600} fz="xl">
							Mini generator
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
										Mini Preview
									</Text>
									<Text c="slate.2" mb="lg">
										The preview will automatically reload after making changes
									</Text>
									<iframe
										ref={frame}
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
										Optionally paste in an existing mini URL to restore the editor
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
												spellCheck={false}
												placeholder="Paste your mini URL here"
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
