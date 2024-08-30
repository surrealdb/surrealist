import classes from "./style.module.scss";
import { Badge, Box, Button, Divider, Flex, Group, ScrollArea, SimpleGrid, Text, TextInput, Tooltip } from "@mantine/core";
import { ActionIcon, CopyButton, Paper, Stack, Textarea } from "@mantine/core";
import { Updater } from "use-immer";
import { adapter } from "~/adapter";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { FieldKindInput, PermissionInput } from "~/components/Inputs";
import { ContentPane } from "~/components/Pane";
import { SaveBox } from "~/components/SaveBox";
import { Spacer } from "~/components/Spacer";
import { SaveableHandle } from "~/hooks/save";
import { useStable } from "~/hooks/stable";
import { SchemaFunction } from "~/types";
import { iconCheck, iconCopy, iconDelete, iconDownload, iconJSON, iconPlus, iconText } from "~/util/icons";
import { SURQL_FILTER } from "~/constants";
import { buildFunctionDefinition } from "~/util/schema";
import { surrealql } from "@surrealdb/codemirror";
import { surqlLinting } from "~/util/editor/extensions";
import { Label } from "~/components/Label";
import { formatQuery, validateQuery } from "~/util/surrealql";
import { showError } from "~/util/helpers";
import { lineNumbers } from "@codemirror/view";
import { useIsLight } from "~/hooks/theme";
import { useMinimumVersion } from "~/hooks/connection";

export interface EditorPanelProps {
	handle: SaveableHandle;
	details: SchemaFunction;
	isCreating: boolean;
	onChange: Updater<SchemaFunction>;
	onDelete: (name: string) => void;
}

export function EditorPanel({
	handle,
	details,
	isCreating,
	onChange,
	onDelete,
}: EditorPanelProps) {
	const isLight = useIsLight();
	const fullName = `fn::${details.name}()`;

	const [hasReturns] = useMinimumVersion("2.0.0");

	const addArgument = useStable(() => {
		onChange((draft) => {
			draft.args.push(["", ""]);
		});
	});

	const downloadBody = useStable(() => {
		adapter.saveFile(
			`Save function`,
			`${details.name}.surql`,
			[SURQL_FILTER],
			() => buildFunctionDefinition(details)
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

	const argColor = isLight
		? 'var(--mantine-color-slate-0)'
		: 'var(--mantine-color-slate-9)';

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
			rightSection={(
				<Tooltip label="Format function">
					<ActionIcon
						onClick={formatFunction}
						aria-label="Format function"
					>
						<Icon path={iconText} />
					</ActionIcon>
				</Tooltip>
			)}
		>
			<Group
				h="100%"
				align="stretch"
				gap="md"
			>
				<CodeEditor
					flex={1}
					h="100%"
					value={details.block}
					autoFocus
					onChange={value => onChange((draft: any) => {
						draft.block = value;
					})}
					extensions={[
						surrealql(),
						surqlLinting(),
						lineNumbers(),
					]}
				/>
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
											variant={copied ? 'gradient' : undefined}
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
						<SimpleGrid cols={2} mt="md">
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
							gap="lg"
						>
							<Box>
								<Group>
									<Label>
										Arguments
									</Label>
									<Spacer />
									<Tooltip label="Add function argument">
										<ActionIcon
											onClick={addArgument}
											aria-label="Add function argument"
										>
											<Icon path={iconPlus} />
										</ActionIcon>
									</Tooltip>
								</Group>
								<Stack gap="xs" mt="xs">
									{details.args.length === 0 && (
										<Text c="slate">
											No arguments defined
										</Text>
									)}
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
												leftSection="$"
												placeholder="name"
												onChange={e => onChange((draft) => {
													draft.args[index][0] = e.target.value;
												})}
												styles={{
													input: {
														backgroundColor: argColor,
														fontFamily: 'var(--mantine-font-family-monospace)',
														paddingLeft: 24,
														paddingRight: 12,
													}
												}}
											/>
											<FieldKindInput
												value={kind}
												flex={1}
												variant="unstyled"
												placeholder="type"
												onChange={value => onChange((draft) => {
													draft.args[index][1] = value.toLowerCase();
												})}
												styles={{
													input: {
														backgroundColor: argColor,
														paddingInline: 12,
														color: isLight ? "#8d6bff" : "#a79fff"
													}
												}}
											/>
											<ActionIcon
												variant="transparent"
												aria-label="Remove function argument"
												onClick={() => onChange((draft) => {
													draft.args.splice(index, 1);
												})}
											>
												<Icon path={iconDelete} />
											</ActionIcon>
										</Group>
									))}
								</Stack>
							</Box>
							<FieldKindInput
								label="Return type"
								placeholder="type"
								disabled={!hasReturns}
								value={details.returns}
								onChange={value => onChange((draft) => {
									draft.returns = value;
								})}
								styles={{
									input: {
										color: isLight ? "#8d6bff" : "#a79fff"
									}
								}}
							/>
							<PermissionInput
								label="Permission"
								value={details.permissions}
								onChange={value => onChange((draft) => {
									draft.permissions = value;
								})}
							/>
							<Textarea
								rows={5}
								label="Comment"
								description="Optional description for this function"
								placeholder="Enter comment..."
								value={details.comment || ''}
								onChange={value => onChange((draft) => {
									draft.comment = value.target.value;
								})}
							/>
							<Spacer />
							{isCreating ? (
								<Button
									variant="gradient"
									rightSection={<Icon path={iconPlus} />}
									onClick={handle.save}
									style={{ flexShrink: 0 }}
								>
									Create function
								</Button>
							) : (
								<SaveBox
									handle={handle}
									inline
									inlineProps={{
										className: classes.saveBox
									}}
								/>
							)}
						</Stack>
					</ScrollArea>
				</Flex>
			</Group>
		</ContentPane>
	);
}
