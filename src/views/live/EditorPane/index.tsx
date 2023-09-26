import { editor } from "monaco-editor";
import { mdiCheck, mdiClose, mdiPencil } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useStoreValue } from "~/store";
import { Panel } from "~/components/Panel";
import { useEffect, useMemo, useRef, useState } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon, Badge, Button, TextInput } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { useInputState } from "@mantine/hooks";
import { validate_live_query } from "~/generated/surrealist-embed";
import { PlaceholderContentWidget } from "~/components/SurrealistEditor/widgets/placeholder";

export interface EditorPaneProps {
	query: { index: number, name: string, text: string } | undefined;
	onSave: (name: string, query: string) => void;
	onClose: () => void;
}

export function EditorPane(props: EditorPaneProps) {
	const editorRef = useRef<editor.IStandaloneCodeEditor>();
	const fontZoomLevel = useStoreValue((state) => state.config.fontZoomLevel);

	const [queryName, setQueryName] = useInputState("");
	const [queryText, setQueryText] = useState("");

	const setQuery = useStable((content: string | undefined) => {
		setQueryText(content ?? "");
		updateQueryValidation(editorRef.current!);
	});

	const scheduleSetQuery = useDebouncedCallback(200, setQuery);

	const handleSave = useStable(() => {
		props.onSave(queryName, queryText);
	});

	const configure = useStable((editor: editor.IStandaloneCodeEditor) => {
		configureQueryEditor(editor);
		updateQueryValidation(editor);

		editorRef.current = editor;

		new PlaceholderContentWidget("LIVE SELECT * FROM ...", editor);
	});

	useEffect(() => {
		setQueryName(props.query?.name || '');
		setQuery(props.query?.text || '');
	}, [props.query]);

	const queryError = useMemo(() => {
		return queryText
			? validate_live_query(queryText)
			: undefined;
	}, [queryText]);

	const canSave = !queryError && queryName.length > 0 && queryText.length > 0;

	return (
		<Panel
			title={props.query ? `Editing Query ${props.query.index + 1}` : "New Query"}
			icon={mdiPencil}
			leftSection={queryError && (
				<Badge color="red">
					{queryError}
				</Badge>
			)}
			rightSection={
				<ActionIcon
					onClick={props.onClose}
					title="Discard changes"
					color="light.4"
				>
					<Icon path={mdiClose} />
				</ActionIcon>
			}
		>
			<TextInput
				placeholder="Untitled query"
				label="Query name"
				value={queryName}
				onChange={setQueryName}
				autoFocus
			/>
			<SurrealistEditor
				asInput
				noExpand
				language="surrealql"
				onMount={configure}
				value={queryText}
				onChange={scheduleSetQuery}
				style={{
					position: "absolute",
					insetInline: 14,
					bottom: 58,
					top: 72
				}}
				options={{
					quickSuggestions: false,
					wordBasedSuggestions: false,
					wrappingStrategy: "advanced",
					wordWrap: "on",
					fontSize: 14 * fontZoomLevel,
				}}
			/>
			<Button
				size="xs"
				onClick={handleSave}
				pos="absolute"
				disabled={!canSave}
				style={{
					insetInline: 12,
					bottom: 12
				}}
			>
				Save query
				<Icon path={mdiCheck} />
			</Button>
		</Panel>
	);
}
