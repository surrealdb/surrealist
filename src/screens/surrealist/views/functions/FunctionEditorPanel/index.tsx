import type { EditorView } from "@codemirror/view";
import { Alert, Badge, Box, Group, Stack } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { useMemo, useState } from "react";
import type { Updater } from "use-immer";
import { adapter } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { SURQL_FILTER } from "~/constants";
import {
	surqlCustomFunctionCompletion,
	surqlLinting,
	surqlTableCompletion,
	surqlVariableCompletion,
} from "~/editor";
import { useSetting } from "~/hooks/config";
import { useDatabaseVersionLinter } from "~/hooks/editor";
import { useStable } from "~/hooks/stable";
import type { FunctionDetails, SchemaFunction } from "~/types";
import { showErrorNotification } from "~/util/helpers";
import { iconDownload, iconJSON, iconText, iconWarning } from "~/util/icons";
import { buildFunctionDefinition } from "~/util/schema";
import { formatQuery, validateQuery } from "~/util/surrealql";

export interface FunctionEditorPanelProps {
	details: SchemaFunction;
	error: string;
	isCreating: boolean;
	onChange: Updater<FunctionDetails>;
}

export function FunctionEditorPanel({
	details,
	error,
	isCreating,
	onChange,
}: FunctionEditorPanelProps) {
	const [hasLineNumbers] = useSetting("appearance", "functionLineNumbers");

	const [editor, setEditor] = useState<EditorView | null>(null);
	const surqlVersion = useDatabaseVersionLinter(editor);

	const downloadBody = useStable(() => {
		adapter.saveFile(`Save function`, `${details.name}.surql`, [SURQL_FILTER], () =>
			buildFunctionDefinition(details),
		);
	});

	const formatFunction = useStable(async () => {
		const isFunctionBlockInvalid = await validateQuery(details.block);
		if (isFunctionBlockInvalid) {
			showErrorNotification({
				title: "Failed to format",
				content: "Your function must be valid to format it",
			});
			return;
		}
		const formattedFunctionBlock = await formatQuery(details.block);
		onChange((draft) => {
			(draft.details as SchemaFunction).block = formattedFunctionBlock;
		});
	});

	const resolveVariables = useStable(() => {
		return details.args.flatMap(([name]) => name);
	});

	const handleChange = useStable((value: string) => {
		onChange((draft: any) => {
			(draft.details as SchemaFunction).block = value;
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

	return (
		<ContentPane
			title="Source Editor"
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
				<Group>
					<ActionButton
						label="Download function"
						onClick={downloadBody}
					>
						<Icon path={iconDownload} />
					</ActionButton>
					<ActionButton
						label="Format function"
						onClick={formatFunction}
					>
						<Icon path={iconText} />
					</ActionButton>
				</Group>
			}
		>
			<Stack
				h="100%"
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
		</ContentPane>
	);
}
