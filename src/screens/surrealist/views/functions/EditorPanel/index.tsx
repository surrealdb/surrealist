import {
	Alert,
	Badge,
	Box,
	Button,
	Divider,
	Flex,
	Group,
	ScrollArea,
	SimpleGrid,
	Text,
	TextInput,
} from "@mantine/core";

import {
	iconCheck,
	iconCopy,
	iconDelete,
	iconDownload,
	iconJSON,
	iconPlus,
	iconText,
	iconWarning,
} from "~/util/icons";

import {
	surqlCustomFunctionCompletion,
	surqlLinting,
	surqlTableCompletion,
	surqlVariableCompletion,
} from "~/editor";

import type { EditorView } from "@codemirror/view";
import { ActionIcon, CopyButton, Paper, Stack, Textarea } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useMemo, useState } from "react";
import type { Updater } from "use-immer";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { FieldKindInput, PermissionInput } from "~/components/Inputs";
import { Label } from "~/components/Label";
import { ContentPane } from "~/components/Pane";
import { SaveBox } from "~/components/SaveBox";
import { Spacer } from "~/components/Spacer";
import { SURQL_FILTER } from "~/constants";
import { useSetting } from "~/hooks/config";
import { useMinimumVersion } from "~/hooks/connection";
import { useDatabaseVersionLinter } from "~/hooks/editor";
import type { SaveableHandle } from "~/hooks/save";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { SchemaFunction } from "~/types";
import { showError } from "~/util/helpers";
import { buildFunctionDefinition } from "~/util/schema";
import { formatQuery, validateQuery } from "~/util/surrealql";
import { SDB_2_0_0 } from "~/util/versions";
import classes from "./style.module.scss";

export interface EditorPanelProps {
	handle: SaveableHandle;
	details: SchemaFunction;
	error: string;
	isCreating: boolean;
	onChange: Updater<SchemaFunction>;
	onDelete: (name: string) => void;
}

export function EditorPanel({
	handle,
	details,
	error,
	isCreating,
	onChange,
	onDelete,
}: EditorPanelProps) {
	const isLight = useIsLight();
	const fullName = `fn::${details.name}()`;

	const [hasLineNumbers] = useSetting("appearance", "functionLineNumbers");

	const [editor, setEditor] = useState<EditorView | null>(null);
	const surqlVersion = useDatabaseVersionLinter(editor);
	const [hasReturns] = useMinimumVersion(SDB_2_0_0);
	const [argToFocus, setArgtoFocus] = useState(-1);

	const addArgument = useStable(() => {
		setArgtoFocus(details.args.length);
		onChange((draft) => {
			draft.args.push(["", ""]);
		});
	});

	const downloadBody = useStable(() => {
		adapter.saveFile(`Save function`, `${details.name}.surql`, [SURQL_FILTER], () =>
			buildFunctionDefinition(details),
		);
	});

	const removeFunction = useStable(() => {
		onDelete(details.name);
	});

	const formatFunction = useStable(() => {
		const isFunctionBlockInvalid = validateQuery(details.block);
		if (isFunctionBlockInvalid) {
			showError({
				title: "Failed to format",
				subtitle: "Your function must be valid to format it",
			});
			return;
		}
		const formattedFunctionBlock = formatQuery(details.block);
		onChange((draft) => {
			draft.block = formattedFunctionBlock;
		});
	});

	const resolveVariables = useStable(() => {
		return details.args.flatMap(([name]) => name);
	});

	const handleChange = useStable((value: string) => {
		onChange((draft: any) => {
			draft.block = value;
		});
	});

	const extensions = useMemo(
		() => [
			surrealql(),
			surqlVersion,
			surqlLinting(),
			surqlVariableCompletion(resolveVariables),
			surqlCustomFunctionCompletion(),
			surqlTableCompletion(),
		],
		[surqlVersion],
	);

	const argColor = isLight ? "var(--mantine-color-slate-0)" : "var(--mantine-color-slate-9)";

	return (
		<ContentPane
			title="Function Editor"
			icon={iconJSON}
			infoSection={
				isCreating && (
					<Badge
						ml="xs"
						variant="light"
					>
						Creating
					</Badge>
				)
			}
			rightSection={
				<ActionButton
					label="Format function"
					onClick={formatFunction}
				>
					<Icon path={iconText} />
				</ActionButton>
			}
		>
			<Group
				h="100%"
				align="stretch"
				gap="md"
			>
				<Stack
					flex={1}
					gap={0}
				>
					{error && (
						<Alert
							icon={<Icon path={iconWarning} />}
							color="red.5"
							mb="xl"
							style={{
								whiteSpace: "pre-wrap",
							}}
						>
							{error}
						</Alert>
					)}
					<Box
						flex={1}
						pos="relative"
					>
						<CodeEditor
							inset={0}
							pos="absolute"
							value={details.block}
							autoFocus
							lineNumbers={hasLineNumbers}
							onMount={setEditor}
							onChange={handleChange}
							extensions={extensions}
						/>
					</Box>
				</Stack>
				<Divider orientation="vertical" />
				<Flex
					w={300}
					h="100%"
					direction="column"
				>
					<Box>
						<Paper bg={isLight ? "slate.0" : "slate.9"}>
							<Flex align="center">
								<ScrollArea
									scrollbars="x"
									type="scroll"
									p="lg"
								>
									<Flex>
										<Text
											fz={15}
											c="surreal"
											ff="mono"
										>
											fn::
										</Text>
										<Text
											fz={15}
											c="bright"
											ff="mono"
										>
											{details.name}()
										</Text>
									</Flex>
								</ScrollArea>
								<Spacer />
								<CopyButton value={fullName}>
									{({ copied, copy }) => (
										<ActionIcon
											variant={copied ? "gradient" : undefined}
											aria-label="Copy function name"
											onClick={copy}
											mr="lg"
										>
											<Icon path={copied ? iconCheck : iconCopy} />
										</ActionIcon>
									)}
								</CopyButton>
							</Flex>
						</Paper>
						<SimpleGrid
							cols={2}
							mt="md"
						>
							<Button
								size="xs"
								radius="xs"
								color="slate"
								variant="light"
								rightSection={<Icon path={iconDownload} />}
								onClick={downloadBody}
							>
								Download
							</Button>
							<Button
								size="xs"
								radius="xs"
								color="pink.8"
								rightSection={<Icon path={iconDelete} />}
								onClick={removeFunction}
							>
								Remove
							</Button>
						</SimpleGrid>
					</Box>
					<ScrollArea
						flex={1}
						mt="lg"
						type="scroll"
						className={classes.metadataScroll}
					>
						<Stack
							w={300}
							h="100%"
							gap="xl"
						>
							<Box>
								<Label>Arguments</Label>
								<Stack
									gap="xs"
									mt="xs"
								>
									{details.args.map(([name, kind], index) => (
										<Group
											key={index}
											gap="xs"
										>
											<TextInput
												flex={1}
												variant="unstyled"
												value={name}
												spellCheck={false}
												autoFocus={index === argToFocus}
												leftSection="$"
												placeholder="name"
												onChange={(e) =>
													onChange((draft) => {
														draft.args[index][0] = e.target.value;
													})
												}
												styles={{
													input: {
														backgroundColor: argColor,
														fontFamily:
															"var(--mantine-font-family-monospace)",
														paddingLeft: 24,
														paddingRight: 12,
													},
												}}
											/>
											<FieldKindInput
												value={kind}
												flex={1}
												variant="unstyled"
												placeholder="type"
												onChange={(value) =>
													onChange((draft) => {
														draft.args[index][1] = value.toLowerCase();
													})
												}
												styles={{
													input: {
														backgroundColor: argColor,
														paddingInline: 12,
													},
												}}
											/>
											<ActionIcon
												variant="transparent"
												aria-label="Remove function argument"
												onClick={() =>
													onChange((draft) => {
														draft.args.splice(index, 1);
													})
												}
											>
												<Icon path={iconDelete} />
											</ActionIcon>
										</Group>
									))}
									<Button
										mt={2}
										size="xs"
										color={isLight ? "black" : "white"}
										variant="subtle"
										leftSection={<Icon path={iconPlus} />}
										onClick={addArgument}
										styles={{
											label: {
												flex: 1,
											},
										}}
									>
										Add function argument
									</Button>
								</Stack>
							</Box>
							<FieldKindInput
								label="Return type"
								placeholder="type"
								disabled={!hasReturns}
								value={details.returns}
								onChange={(value) =>
									onChange((draft) => {
										draft.returns = value;
									})
								}
								styles={{
									input: {
										color: isLight ? "#8d6bff" : "#a79fff",
									},
								}}
							/>
							<PermissionInput
								label="Permission"
								value={details.permissions}
								onChange={(value) =>
									onChange((draft) => {
										draft.permissions = value;
									})
								}
							/>
							<Textarea
								rows={5}
								label="Comment"
								description="Optional description for this function"
								placeholder="Enter comment..."
								value={details.comment}
								onChange={(value) =>
									onChange((draft) => {
										draft.comment = value.target.value;
									})
								}
							/>
						</Stack>
					</ScrollArea>

					<Box mt="sm">
						{isCreating ? (
							<Button
								variant="gradient"
								rightSection={<Icon path={iconPlus} />}
								onClick={() => handle.save()}
								style={{ flexShrink: 0 }}
							>
								Create function
							</Button>
						) : (
							<SaveBox
								handle={handle}
								inline
								minimal
								inlineProps={{
									className: classes.saveBox,
								}}
							/>
						)}
					</Box>
				</Flex>
			</Group>
		</ContentPane>
	);
}
