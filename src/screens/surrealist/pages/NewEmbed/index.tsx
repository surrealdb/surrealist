import {
	ActionIcon,
	Button,
	CopyButton,
	Grid,
	Group,
	Modal,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedState, useDisclosure } from "@mantine/hooks";
import { Icon, iconCheck, iconClose, iconTransfer, iconXml, SectionTitle } from "@surrealdb/ui";
import { useMemo, useRef, useState } from "react";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { useStable } from "~/hooks/stable";
import { dedent } from "~/util/dedent";
import { PageContainer } from "../../components/PageContainer";
import { DEFAULT_STATE, Embedder, EmbedState } from "./embedder";

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
		<>
			<PageBreadcrumbs items={[{ label: "Embed Creator" }]} />
			<PageContainer>
				<SectionTitle>Embed Creator</SectionTitle>

				<Grid
					gap="xl"
					mt="xl"
				>
					<Grid.Col span={{ base: 12, md: 5 }}>
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
									color="obsidian"
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
					<Grid.Col span={{ base: 12, md: 7 }}>
						<Stack gap="xl">
							<Paper
								style={{ overflow: "hidden" }}
								withBorder
							>
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
									Copy your Surrealist Mini as an embeddable iframe snippet or as
									direct URL
								</Text>
								<SimpleGrid
									cols={2}
									mt="xl"
								>
									<CopyButton value={snippet}>
										{({ copied, copy }) => (
											<Button
												color="obsidian"
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
												color="obsidian"
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
			</PageContainer>
		</>
	);
}
