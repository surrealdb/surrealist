import { editor } from "monaco-editor";
import { mdiCheck, mdiClose, mdiPencil } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useStoreValue } from "~/store";
import { Panel } from "~/components/Panel";
import { useEffect, useRef, useState } from "react";
import { configureQueryEditor, updateQueryValidation } from "~/util/editor";
import { useDebouncedCallback } from "~/hooks/debounce";
import { SurrealistEditor } from "~/components/SurrealistEditor";
import { ActionIcon, Group, TextInput } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { useInputState } from "@mantine/hooks";

export interface EditorPaneProps {
	query: { name: string, text: string } | undefined;
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
	});

	useEffect(() => {
		setQueryName(props.query?.name || '');
		setQuery(props.query?.text || '');
	}, [props.query]);

	return (
		<Panel
			title="Live Query Editor"
			icon={mdiPencil}
			rightSection={
				<Group>
					<ActionIcon
						onClick={handleSave}
						disabled={queryName.length === 0 || queryText.length === 0}
						title="Save query"
					>
						<Icon color="surreal" path={mdiCheck} />
					</ActionIcon>

					<ActionIcon
						onClick={props.onClose}
						title="Discard changes"
					>
						<Icon color="red" path={mdiClose} />
					</ActionIcon>
				</Group>
			}
		>
			<TextInput
				placeholder="Untitled query"
				label="Query name"
				value={queryName}
				onChange={setQueryName}
			/>
			<SurrealistEditor
				noExpand
				language="surrealql"
				onMount={configure}
				value={queryText}
				onChange={scheduleSetQuery}
				style={{
					position: "absolute",
					insetInline: 24,
					bottom: 0,
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
		</Panel>
	);
}
