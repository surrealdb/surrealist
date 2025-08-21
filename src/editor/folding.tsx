import { foldCode } from "@codemirror/language";
import type { EditorView } from "@codemirror/view";

/**
 * Apply automatic folding to objects/arrays at the specified depth level
 * @param view - CodeMirror editor view
 * @param autoCollapseDepth - Depth level to start folding (0 = disabled)
 */
export function applyAutoFolding(view: EditorView, autoCollapseDepth: number) {
	if (autoCollapseDepth <= 0) return;

	const doc = view.state.doc;
	const content = doc.toString();

	try {
		let currentDepth = 0;
		let inString = false;
		let escapeNext = false;

		for (let i = 0; i < content.length; i++) {
			const char = content[i];

			if (escapeNext) {
				escapeNext = false;
				continue;
			}

			if (char === "\\" && inString) {
				escapeNext = true;
				continue;
			}

			if (char === '"') {
				inString = !inString;
				continue;
			}

			if (inString) continue;

			if (char === "{" || char === "[") {
				currentDepth++;

				if (currentDepth === autoCollapseDepth) {
					const lineNumber = doc.lineAt(i).number;

					view.dispatch({
						selection: { anchor: doc.line(lineNumber).from },
					});

					foldCode(view);
				}
			} else if (char === "}" || char === "]") {
				currentDepth = Math.max(0, currentDepth - 1);
			}
		}
	} catch {
		// Ignore errors
	}
}
