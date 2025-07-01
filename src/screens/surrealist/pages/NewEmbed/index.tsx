import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Grid,
	Group,
	Modal,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import { useDebouncedState, useDisclosure } from "@mantine/hooks";
import { useMemo, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { TopGlow } from "~/components/TopGlow";
import { useStable } from "~/hooks/stable";
import { dedent } from "~/util/dedent";
import { iconCheck, iconClose, iconTransfer, iconXml } from "~/util/icons";
import { DEFAULT_STATE, EmbedState, Embedder } from "./embedder";

export function NewEmbedPage() {
	const [url, setUrl] = useDebouncedState("", 250);
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

	const snippet = useMemo(() => {
		return dedent(`
			<iframe
				width="750"
				height="500"
				src="${url}"
				title="Surrealist Mini"
				frameborder="0"
				allowTransparency="true"
				referrerpolicy="strict-origin-when-cross-origin">
			</iframe>
		`);
	}, [url]);

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
				mt={86}
			>
				<Stack
					px="xl"
					mx="auto"
					maw={1200}
					pb={68}
				>
					<Box>
						<PageBreadcrumbs
							items={[
								{ label: "Surrealist", href: "/overview" },
								{ label: "Embed Surrealist" },
							]}
						/>
						<PrimaryTitle
							fz={32}
							mt="sm"
						>
							Embed Surrealist
						</PrimaryTitle>
					</Box>

					<Grid
						gutter="xl"
						mt="xl"
					>
						<Grid.Col span={5}>
							<Stack gap="xl">
								<Paper p="xl">
									<Embedder
										value={parsedState}
										onChangeURL={setUrl}
									/>
								</Paper>
								<Paper p="xl">
									<Text
										fw={600}
										fz="lg"
										mb={2}
										c="bright"
									>
										Restore configuration
									</Text>
									<Text>
										Optionally paste in an existing mini URL to restore the
										configuration
									</Text>
									<Button
										mt="xl"
										size="sm"
										color="slate"
										variant="light"
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
								</Paper>
							</Stack>
						</Grid.Col>
						<Grid.Col span={7}>
							<Stack gap="xl">
								<Paper style={{ overflow: "hidden" }}>
									<iframe
										ref={frame}
										width="100%"
										height="500"
										src={url}
										title="Surrealist Mini"
										referrerPolicy="strict-origin-when-cross-origin"
										style={{
											border: "none",
											display: "block",
										}}
									/>
								</Paper>
								<Paper p="xl">
									<Text
										fw={600}
										fz="lg"
										mb={2}
										c="bright"
									>
										Integrate your Surrealist Mini
									</Text>
									<Text>
										Copy your Surrealist Mini as an embeddable iframe snippet or
										as direct URL
									</Text>
									<SimpleGrid
										cols={2}
										mt="xl"
									>
										<CopyButton value={snippet}>
											{({ copied, copy }) => (
												<Button
													color="slate"
													variant={copied ? "gradient" : "light"}
													leftSection={
														<Icon path={copied ? iconCheck : iconXml} />
													}
													onClick={copy}
												>
													Copy iframe
												</Button>
											)}
										</CopyButton>
										<CopyButton value={url}>
											{({ copied, copy }) => (
												<Button
													color="slate"
													variant={copied ? "gradient" : "light"}
													leftSection={
														<Icon
															path={copied ? iconCheck : iconTransfer}
														/>
													}
													onClick={copy}
												>
													Copy URL
												</Button>
											)}
										</CopyButton>
									</SimpleGrid>
								</Paper>
							</Stack>
						</Grid.Col>
					</Grid>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
