import { Prec } from "@codemirror/state";
import { type EditorView, keymap } from "@codemirror/view";
import { ActionIcon, Badge, Group } from "@mantine/core";
import { surrealql } from "@surrealdb/codemirror";
import { Value } from "@surrealdb/ql-wasm";
import { useEffect, useMemo, useState } from "react";
import { type HtmlPortalNode, OutPortal } from "react-reverse-portal";
import { decodeCbor } from "surrealdb";
import { ActionButton } from "~/components/ActionButton";
import { CodeEditor } from "~/components/CodeEditor";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { runQueryKeymap, surqlLinting } from "~/editor";
import { queryEditorField, setQueryEditor } from "~/editor/query";
import { useActiveQuery } from "~/hooks/connection";
import { useDebouncedFunction } from "~/hooks/debounce";
import { useActiveConnection } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import { iconClose, iconDollar } from "~/util/icons";

export interface VariablesPaneProps {
	isValid: boolean;
	switchPortal?: HtmlPortalNode<any>;
	corners?: string;
	lineNumbers: boolean;
	editor: EditorView;
	setIsValid: (isValid: boolean) => void;
	closeVariables: () => void;
}

export function VariablesPane({
	isValid,
	switchPortal,
	corners,
	lineNumbers,
	editor,
	setIsValid,
	closeVariables,
}: VariablesPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();
	const [connection] = useActiveConnection();
	const activeTab = useActiveQuery();

	const [variableEditor, setVariableEditor] = useState<EditorView | null>(null);

	const setVariables = useDebouncedFunction((content: string | undefined) => {
		if (!activeTab || !connection) return;

		try {
			const json = content || "";
			const parsed = decodeCbor(Value.from_string(json).to_cbor().buffer);

			if (typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new TypeError("Must be object");
			}

			updateQueryTab(connection, {
				id: activeTab.id,
				variables: json,
			});

			setIsValid(true);
		} catch {
			setIsValid(false);
		}
	}, 50);

	useEffect(() => {
		if (variableEditor && editor) {
			setQueryEditor(variableEditor, editor);
		}
	}, [variableEditor, editor]);

	const extensions = useMemo(
		() => [surrealql(), surqlLinting(), queryEditorField, Prec.high(keymap.of(runQueryKeymap))],
		[],
	);

	return (
		<ContentPane
			title="Variables"
			icon={iconDollar}
			radius={corners}
			rightSection={
				switchPortal ? (
					<OutPortal node={switchPortal} />
				) : (
					<Group gap="xs">
						{!isValid && (
							<Badge
								color="red"
								variant="light"
							>
								Invalid syntax
							</Badge>
						)}
						<ActionButton
							color="slate"
							onClick={closeVariables}
							label="Close panel"
						>
							<Icon path={iconClose} />
						</ActionButton>
					</Group>
				)
			}
		>
			<CodeEditor
				value={activeTab?.variables || ""}
				onChange={setVariables}
				onMount={setVariableEditor}
				lineNumbers={lineNumbers}
				extensions={extensions}
			/>
		</ContentPane>
	);
}
