import {
	ActionIcon,
	Box,
	Button,
	CopyButton,
	Flex,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Textarea,
} from "@mantine/core";
import { Icon, iconCheck, iconCopy, iconDelete, iconList, iconPlus } from "@surrealdb/ui";
import { Updater } from "use-immer";
import { ActionButton } from "~/components/ActionButton";
import { PermissionInput } from "~/components/Inputs";
import { ContentPane } from "~/components/Pane";
import { SaveBox } from "~/components/SaveBox";
import { Spacer } from "~/components/Spacer";
import { SaveableHandle } from "~/hooks/save";
import { useIsLight } from "~/hooks/theme";
import { SchemaParameter } from "~/types";
import classes from "./style.module.scss";

export interface ParameterPropertiesPanelProps {
	handle: SaveableHandle;
	details: SchemaParameter;
	isCreating: boolean;
	onChange: Updater<SchemaParameter>;
	onDelete: (name: string) => void;
}

export function ParameterPropertiesPanel({
	handle,
	details,
	isCreating,
	onChange,
	onDelete,
}: ParameterPropertiesPanelProps) {
	const isLight = useIsLight();
	const fullName = `$${details.name}`;

	return (
		<ContentPane
			title="Properties"
			icon={iconList}
			rightSection={
				<ActionButton
					color="pink.6"
					variant="light"
					label="Delete parameter"
					onClick={() => onDelete(details.name)}
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
				>
					<Stack
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
							fullWidth
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
		</ContentPane>
	);
}
