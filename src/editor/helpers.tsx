import { EditorView } from "@codemirror/view";

/**
 * Set the contents of the editor
 *
 * @param editor The editor to set the text of
 * @param text The text to set the editor to
 */
export function setEditorText(editor: EditorView, text: string) {
	editor.dispatch({
		changes: { from: 0, to: editor.state.doc.length, insert: text },
	});
}
