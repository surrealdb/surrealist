import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Flex,
	Group,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
	TextInput,
} from "@mantine/core";
import { Icon, iconCheck, iconCopy, iconDelete, iconList, iconPlus } from "@surrealdb/ui";
import { useState } from "react";
import { Updater } from "use-immer";
import { ActionButton } from "~/components/ActionButton";
import { FieldKindInput, PermissionInput } from "~/components/Inputs";
import { Label } from "~/components/Label";
import { ContentPane } from "~/components/Pane";
import { SaveBox } from "~/components/SaveBox";
import { Spacer } from "~/components/Spacer";
import { useMinimumVersion } from "~/hooks/connection";
import { SaveableHandle } from "~/hooks/save";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { FunctionDetails, SchemaFunction } from "~/types";
import { SDB_2_0_0 } from "~/util/versions";
import classes from "./style.module.scss";

export interface FunctionPropertiesPanelProps {
	handle: SaveableHandle;
	details: SchemaFunction;
	isCreating: boolean;
	onChange: Updater<FunctionDetails>;
	onDelete: (details: FunctionDetails) => void;
}

export function FunctionPropertiesPanel({
	handle,
	details,
	isCreating,
	onChange,
	onDelete,
}: FunctionPropertiesPanelProps) {
	const isLight = useIsLight();
	const fullName = `fn::${details.name}()`;
	const [hasReturns] = useMinimumVersion(SDB_2_0_0);
	const [argToFocus, setArgtoFocus] = useState(-1);

	const addArgument = useStable(() => {
		setArgtoFocus(details.args.length);
		onChange((draft) => {
			(draft.details as SchemaFunction).args.push(["", ""]);
		});
	});

	const argColor = isLight
		? "var(--mantine-color-obsidian-0)"
		: "var(--mantine-color-obsidian-9)";
	return (
		<ContentPane
			title="Properties"
			icon={iconList}
			rightSection={
				<ActionButton
					color="pink.6"
					variant="light"
					label="Delete function"
					onClick={() =>
						onDelete({
							type: "function",
							details,
						})
					}
				>
					<Icon path={iconDelete} />
				</ActionButton>
			}
		>
			<Flex
				h="100%"
				direction="column"
			>
				<Box>
					<Paper bg={isLight ? "obsidian.0" : "obsidian.9"}>
						<Flex align="center">
							<ScrollArea
								scrollbars="x"
								type="scroll"
								p="lg"
							>
								<Flex>
									<Text
										fz={15}
										c="violet"
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
				</Box>
				<ScrollArea
					flex={1}
					mt="lg"
					type="scroll"
				>
					<Stack
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
													(draft.details as SchemaFunction).args[
														index
													][0] = e.target.value;
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
													(draft.details as SchemaFunction).args[
														index
													][1] = value;
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
													(draft.details as SchemaFunction).args.splice(
														index,
														1,
													);
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
									const details = draft.details as SchemaFunction;

									details.returns = value;
									draft.details = details;
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
									const details = draft.details as SchemaFunction;

									details.permissions = value;
									draft.details = details;
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
									const details = draft.details as SchemaFunction;

									details.comment = value.target.value;
									draft.details = details;
								})
							}
						/>
					</Stack>
				</ScrollArea>

				<Box mt="sm">
					{isCreating ? (
						<Button
							fullWidth
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
		</ContentPane>
	);
}
