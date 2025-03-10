import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Button,
	Divider,
	Group,
	Modal,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { DEFAULT_STATE, Embedder, EmbedState } from "~/components/Embedder";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { iconClose } from "~/util/icons";
import { useDebouncedState, useDisclosure } from "@mantine/hooks";
import { useState, useRef } from "react";
import { useStable } from "~/hooks/stable";

export function EmbedPage() {
	const [url, setUrl] = useDebouncedState("", 750);
	const [parsedState, setParsedState] = useState<EmbedState>();
	const [showParse, showParseHandle] = useDisclosure();

	const frame = useRef<HTMLIFrameElement>(null);

	const parseUrl = useStable((e: React.ChangeEvent<HTMLInputElement>) => {
		const state = { ...DEFAULT_STATE };
		const value = e.target.value;
		const params = new URL(value).searchParams;

		state.setup = params.get("setup") || state.setup;
		state.query = params.get("query") || state.query;
		state.variables = params.get("variables") || state.variables;
		state.dataset = params.get("dataset") || state.dataset;
		state.orientation = (params.get("orientation") as any) || state.orientation;
		state.transparent = params.has("transparent") || state.transparent;
		state.linenumbers = params.has("linenumbers") || state.linenumbers;

		setParsedState(state);
		showParseHandle.close();
	});

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={250} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				<Stack
					w="100%"
					maw={1100}
					mx="auto"
					gap={38}
					pos="relative"
				>
					<Box>
						<PrimaryTitle>Embed Surrealist</PrimaryTitle>
						<Text fz="xl">
							Integrate Surrealist Mini into to your content for interactive SurrealQL
							snippets
						</Text>
					</Box>
					<SimpleGrid
						cols={2}
						spacing={52}
					>
						<Embedder
							value={parsedState}
							onChangeURL={setUrl}
						/>
						<Stack gap="lg">
							<Box>
								<Text
									fw={600}
									fz="lg"
									mb={2}
									c="bright"
								>
									Mini Preview
								</Text>
								<Text
									c="slate.2"
									mb="lg"
								>
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
									}}
								/>
							</Box>
							<Divider />
							<Box>
								<Text
									fw={600}
									fz="lg"
									mb={2}
									c="bright"
								>
									Restore editor
								</Text>
								<Text
									c="slate.2"
									mb="sm"
								>
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
										<ActionIcon onClick={showParseHandle.close}>
											<Icon path={iconClose} />
										</ActionIcon>
									</Group>
								</Modal>
							</Box>
						</Stack>
					</SimpleGrid>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
