import { Alert, Badge, Box, Button, Divider, Flex, Group, ScrollArea, Text } from "@mantine/core";

import { iconCheck, iconCopy, iconDelete, iconPlus, iconText, iconWarning } from "~/util/icons";

import { ActionIcon, CopyButton, Paper, Stack, Textarea } from "@mantine/core";
import type { Updater } from "use-immer";
import { Icon } from "~/components/Icon";
import { PermissionInput } from "~/components/Inputs";
import { ContentPane } from "~/components/Pane";
import { SaveBox } from "~/components/SaveBox";
import { Spacer } from "~/components/Spacer";
import type { SaveableHandle } from "~/hooks/save";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { SchemaParameter } from "~/types";
import classes from "./style.module.scss";
import { CodeEditor } from "~/components/CodeEditor";
import { useMemo, useState } from "react";
import { surrealql } from "@surrealdb/codemirror";
import { surqlLinting } from "~/editor/surrealql";
import { surqlTableCompletion } from "~/editor/tables";
import { useDatabaseVersionLinter } from "~/hooks/editor";
import { EditorView } from "@codemirror/view";
import { ActionButton } from "~/components/ActionButton";

export interface EditorPanelProps {
	handle: SaveableHandle;
	details: SchemaParameter;
	error: string;
	isCreating: boolean;
	onChange: Updater<SchemaParameter>;
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
	const fullName = `$${details.name}`;
	const [editor, setEditor] = useState<EditorView | null>(null);
	const surqlVersion = useDatabaseVersionLinter(editor);

	const removeParameter = useStable(() => {
		onDelete(details.name);
	});

	const extensions = useMemo(
		() => [surrealql(), surqlVersion, surqlLinting(), surqlTableCompletion()],
		[surqlVersion],
	);

	const handleChange = useStable((value: string) => {
		onChange((draft: any) => {
			draft.value = value;
		});
	});

	return (
		<ContentPane
			title="Parameter Editor"
			icon={iconText}
			rightSection={
				<ActionButton
					color="pink.6"
					variant="light"
					label="Delete parameter"
					onClick={removeParameter}
				>
					<Icon path={iconDelete} />
				</ActionButton>
			}
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
							value={details.value}
							autoFocus
							lineNumbers={true}
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
									<Text
										fz={15}
										c="yellow"
										ff="mono"
									>
										${details.name}
									</Text>
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
								description="Optional description for this parameter"
								placeholder="Enter comment..."
								value={details.comment ?? ""}
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
								Create parameter
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
