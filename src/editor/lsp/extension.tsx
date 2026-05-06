/**
 * CodeMirror 6 extension that wires an editor view to a
 * [`SurqlLspClient`](./client.ts).
 *
 * Responsibilities:
 *
 *  * Send `textDocument/didOpen` once the view is ready and
 *    `textDocument/didChange` on every edit, so the server's view of
 *    the buffer stays current.
 *  * Pull completions via `textDocument/completion` and adapt them to
 *    the CodeMirror autocomplete contract.
 *  * Render hover responses (`textDocument/hover`) as standard
 *    `hoverTooltip` content.
 *  * Surface server-pushed diagnostics through the standard
 *    [`linter`](https://codemirror.net/docs/ref/#lint.linter) API.
 */

import {
	autocompletion,
	type Completion,
	type CompletionContext,
	type CompletionResult,
} from "@codemirror/autocomplete";
import { type Diagnostic as CmDiagnostic, linter, setDiagnostics } from "@codemirror/lint";
import type { EditorState, Extension } from "@codemirror/state";
import { hoverTooltip, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { marked } from "marked";
import type { SurqlLspClient } from "./client";

interface LspPosition {
	line: number;
	character: number;
}

interface LspRange {
	start: LspPosition;
	end: LspPosition;
}

interface LspDiagnostic {
	range: LspRange;
	severity?: 1 | 2 | 3 | 4;
	message: string;
	source?: string;
}

interface LspCompletionItem {
	label: string;
	kind?: number;
	detail?: string;
	documentation?: string | { kind: string; value: string };
	insertText?: string;
	sortText?: string;
}

interface LspHover {
	contents: { kind: string; value: string } | string;
	range?: LspRange;
}

export interface SurqlLanguageServerOptions {
	client: SurqlLspClient;
	/**
	 * URI used for `textDocument/*` notifications. CodeMirror buffers
	 * usually don't have a real path; pick a stable synthetic URI per
	 * editor instance so completions and diagnostics line up
	 * server-side.
	 */
	uri: string;
}

/**
 * Build the CodeMirror 6 extension bundle that connects an editor
 * view to a SurrealQL language-server client.
 */
export function surqlLanguageServer(options: SurqlLanguageServerOptions): Extension {
	return [
		documentSyncPlugin(options),
		linter(() => [], { delay: 250, needsRefresh: () => true }),
		autocompletion({ override: [completionSource(options)] }),
		hoverTooltip(async (view, pos) => {
			const position = offsetToPosition(view.state, pos);
			try {
				const hover = await options.client.sendRequest<LspHover | null>(
					"textDocument/hover",
					{
						textDocument: { uri: options.uri },
						position,
					},
				);
				if (!hover) return null;
				const value =
					typeof hover.contents === "string" ? hover.contents : hover.contents.value;
				const range = hover.range;
				return {
					pos: range ? positionToOffset(view.state, range.start) : pos,
					end: range ? positionToOffset(view.state, range.end) : pos,
					create: () => ({ dom: createInfoTooltip(value) }),
				};
			} catch {
				return null;
			}
		}),
	];
}

function documentSyncPlugin({ client, uri }: SurqlLanguageServerOptions) {
	return ViewPlugin.define((view) => {
		let version = 0;
		let unsubscribe: (() => void) | null = null;

		const open = async () => {
			await client.ready();
			await client.sendNotification("textDocument/didOpen", {
				textDocument: {
					uri,
					languageId: "surrealql",
					version: ++version,
					text: view.state.doc.toString(),
				},
			});
		};

		const sendChange = async () => {
			try {
				await client.sendNotification("textDocument/didChange", {
					textDocument: { uri, version: ++version },
					contentChanges: [{ text: view.state.doc.toString() }],
				});
			} catch (error) {
				console.warn("surrealql language server: didChange failed", error);
			}
		};

		const wireDiagnostics = () => {
			unsubscribe = client.onDiagnostics((targetUri, diagnostics) => {
				if (targetUri !== uri) return;
				const cmDiagnostics = (diagnostics as LspDiagnostic[] | null | undefined)
					?.map((d) => convertDiagnostic(d, view.state))
					.filter((value): value is CmDiagnostic => value !== null);
				view.dispatch(setDiagnostics(view.state, cmDiagnostics ?? []));
			});
		};

		open().catch((error) => {
			console.warn("surrealql language server: didOpen failed", error);
		});
		wireDiagnostics();

		return {
			update(update: ViewUpdate) {
				if (update.docChanged) {
					sendChange().catch(() => {
						/* surfaced inside sendChange */
					});
				}
			},
			destroy() {
				unsubscribe?.();
				client
					.sendNotification("textDocument/didClose", {
						textDocument: { uri },
					})
					.catch(() => {
						/* worker may already be torn down */
					});
			},
		};
	});
}

function completionSource({ client, uri }: SurqlLanguageServerOptions) {
	return async (context: CompletionContext): Promise<CompletionResult | null> => {
		const word = context.matchBefore(/[\w$:.<>-]+/);
		if (!word && !context.explicit) return null;

		try {
			const result = await client.sendRequest<
				LspCompletionItem[] | { items: LspCompletionItem[] } | null
			>("textDocument/completion", {
				textDocument: { uri },
				position: offsetToPosition(context.state, context.pos),
			});

			if (!result) return null;
			const items = Array.isArray(result) ? result : result.items;
			if (!items || items.length === 0) return null;

			const options = items.map<Completion>((item) => {
				const documentation =
					typeof item.documentation === "string"
						? item.documentation
						: item.documentation?.value;

				return {
					label: item.label,
					detail: item.detail,
					info: documentation ? () => createInfoTooltip(documentation) : undefined,
					apply: item.insertText ?? item.label,
					type: lspKindToCodeMirror(item.kind),
					boost: lspSortBoost(item.sortText),
				};
			});

			return {
				from: word ? word.from : context.pos,
				options,
				validFor: /^[\w$:.<>-]*$/,
			};
		} catch {
			return null;
		}
	};
}

function convertDiagnostic(diag: LspDiagnostic, state: EditorState): CmDiagnostic | null {
	const from = positionToOffset(state, diag.range.start);
	const to = Math.max(from, positionToOffset(state, diag.range.end));
	if (Number.isNaN(from) || Number.isNaN(to)) return null;
	return {
		from,
		to,
		message: diag.message,
		severity: lspSeverityToCodeMirror(diag.severity),
		source: diag.source ?? "SurrealQL",
	};
}

function lspSeverityToCodeMirror(severity?: number): CmDiagnostic["severity"] {
	switch (severity) {
		case 1:
			return "error";
		case 2:
			return "warning";
		case 3:
			return "info";
		case 4:
		default:
			return "info";
	}
}

function lspKindToCodeMirror(kind?: number): Completion["type"] {
	// LSP `CompletionItemKind` values: 1=Text, 3=Function, 5=Field, 6=Variable,
	// 14=Keyword, 22=Struct, 24=Operator. Map to the closest CodeMirror type.
	switch (kind) {
		case 3:
			return "function";
		case 5:
			return "property";
		case 6:
			return "variable";
		case 14:
			return "keyword";
		case 22:
			return "class";
		case 24:
			return "text";
		default:
			return undefined;
	}
}

function lspSortBoost(sortText?: string): number | undefined {
	if (!sortText) return undefined;
	// Our server emits sort keys like "0-aaa-star" / "1-fields" / "2-keywords".
	// Higher boost => earlier in the list.
	const head = sortText.match(/^(\d+)/);
	if (!head) return undefined;
	const tier = Number.parseInt(head[1], 10);
	if (Number.isNaN(tier)) return undefined;
	return 50 - tier;
}

function offsetToPosition(state: EditorState, offset: number): LspPosition {
	const line = state.doc.lineAt(offset);
	return {
		line: line.number - 1,
		character: utf16Length(line.text.slice(0, offset - line.from)),
	};
}

function positionToOffset(state: EditorState, position: LspPosition): number {
	if (position.line < 0 || position.line >= state.doc.lines) {
		return state.doc.length;
	}
	const line = state.doc.line(position.line + 1);
	let offset = line.from;
	let remaining = position.character;
	for (const ch of line.text) {
		if (remaining <= 0) break;
		const consumed = utf16Length(ch);
		if (remaining < consumed) break;
		remaining -= consumed;
		offset += ch.length;
	}
	return offset;
}

function utf16Length(text: string): number {
	let length = 0;
	for (let i = 0; i < text.length; i++) {
		// Strings in JS are already UTF-16; iterating by code unit
		// gives the LSP `Position.character` directly.
		length++;
	}
	return length;
}

function markdownToHtml(markdown: string): string {
	const html = marked.parse(markdown, {
		breaks: true,
		async: false,
	});
	return html as string;
}

function createInfoTooltip(markdown: string): HTMLElement {
	const dom = document.createElement("div");
	dom.className = "cm-tooltip-surql-lsp";
	dom.innerHTML = markdownToHtml(markdown);
	return dom;
}

// Re-export so callers don't have to import from `@codemirror/view`
// when they only want the extension shape.
export type { Extension };
