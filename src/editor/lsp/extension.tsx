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
import { type Diagnostic as CmDiagnostic, forceLinting, linter } from "@codemirror/lint";
import { type EditorState, Extension, StateEffect, StateField } from "@codemirror/state";
import { hoverTooltip, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import DOMPurify from "dompurify";
import { marked } from "marked";
import type { SurqlLspClient } from "./client";
import { inlayHintsExtension } from "./inlayHints";
import { signatureHelpExtension } from "./signature";

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
	code?: string | number;
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

/**
 * Callback invoked when the LSP publishes diagnostics for the bound
 * document. The argument is the message of the first parse-error
 * diagnostic (or empty string when there are none).
 */
export type LspValidateListener = (message: string) => void;

export interface SurqlLanguageServerOptions {
	client: SurqlLspClient;
	/**
	 * URI used for `textDocument/*` notifications. CodeMirror buffers
	 * usually don't have a real path; pick a stable synthetic URI per
	 * editor instance so completions and diagnostics line up
	 * server-side.
	 */
	uri: string;
	/**
	 * Optional callback invoked whenever the server publishes
	 * diagnostics for this buffer. Receives the message of the first
	 * parse-error diagnostic (or `""` when none).
	 */
	onValidate?: LspValidateListener;
	/**
	 * Whether to render `textDocument/inlayHint` results as inline
	 * widget decorations. Defaults to `true`.
	 */
	inlayHints?: boolean;
}

const setLspDiagnostics = StateEffect.define<readonly CmDiagnostic[]>();

/**
 * Hold LSP diagnostics in editor state and expose them through
 * `linter()` so they merge with other linters (e.g. the SurrealDB
 * version checker). Using `setDiagnostics()` directly would be wiped
 * whenever another linter pass runs.
 */
function lspDiagnosticsExtension(): Extension {
	const field = StateField.define<readonly CmDiagnostic[]>({
		create: () => [],
		update(value, transaction) {
			for (const effect of transaction.effects) {
				if (effect.is(setLspDiagnostics)) {
					return effect.value;
				}
			}
			return value;
		},
	});

	return [
		field,
		linter((view) => view.state.field(field), {
			needsRefresh: (update) =>
				update.transactions.some((transaction) =>
					transaction.effects.some((effect) => effect.is(setLspDiagnostics)),
				),
		}),
	];
}

/**
 * Build the CodeMirror 6 extension bundle that connects an editor
 * view to a SurrealQL language-server client.
 */
export function surqlLanguageServer(options: SurqlLanguageServerOptions): Extension {
	return [
		lspDiagnosticsExtension(),
		documentSyncPlugin(options),
		autocompletion({ override: [completionSource(options)] }),
		signatureHelpExtension({ client: options.client, uri: options.uri }),
		options.inlayHints !== false
			? inlayHintsExtension({ client: options.client, uri: options.uri })
			: [],
		hoverProvider(options),
	];
}

/**
 * Hover provider with a stale-response guard. Without the guard a
 * slow hover at one position can land after the user has moved the
 * cursor and the editor is asking about a new token, painting the
 * wrong tooltip.
 */
function hoverProvider({ client, uri }: SurqlLanguageServerOptions): Extension {
	let latestHoverId = 0;
	return hoverTooltip(async (view, pos) => {
		const requestId = ++latestHoverId;
		const position = offsetToPosition(view.state, pos);
		const controller = new AbortController();
		try {
			const hover = await client.sendRequest<LspHover | null>(
				"textDocument/hover",
				{
					textDocument: { uri },
					position,
				},
				{ signal: controller.signal },
			);
			if (requestId !== latestHoverId || !hover) return null;
			const value =
				typeof hover.contents === "string" ? hover.contents : hover.contents.value;
			const range = hover.range;
			return {
				pos: range ? positionToOffset(view.state, range.start) : pos,
				end: range ? positionToOffset(view.state, range.end) : pos,
				create: () => ({ dom: createInfoTooltip(value) }),
			};
		} catch (error) {
			if (import.meta.env.DEV && !isAbortError(error)) {
				console.warn("surrealql language server: hover failed", error);
			}
			return null;
		}
	});
}

function isAbortError(error: unknown): boolean {
	return (
		typeof error === "object" &&
		error !== null &&
		"name" in error &&
		(error as { name: string }).name === "AbortError"
	);
}

function documentSyncPlugin({ client, uri, onValidate }: SurqlLanguageServerOptions) {
	return ViewPlugin.define((view) => {
		let version = 0;
		let unsubscribe: (() => void) | null = null;
		let unsubscribeRestart: (() => void) | null = null;
		let destroyed = false;
		let opened = false;
		// Synchronous re-entrancy guard. Set to `true` the moment a
		// caller commits to running `open()`; subsequent callers that
		// see the flag bail out immediately so we never queue two
		// concurrent `didOpen` notifications for the same URI.
		let inFlightOpen = false;
		// Set when a buffer is empty during the initial open. Cleared
		// (and `open()` re-invoked) the next time the document gains
		// content via an editor update.
		let needsContentToOpen = false;

		const open = async () => {
			if (inFlightOpen || opened || destroyed) return;
			inFlightOpen = true;
			try {
				await client.ensureInitialized();
				if (destroyed || opened) return;

				const text = view.state.doc.toString();
				if (text.length === 0) {
					needsContentToOpen = true;
					return;
				}

				needsContentToOpen = false;
				await client.sendNotification("textDocument/didOpen", {
					textDocument: {
						uri,
						languageId: "surrealql",
						version: ++version,
						text,
					},
				});
				opened = true;
			} finally {
				inFlightOpen = false;
			}
		};

		const sendChange = async () => {
			if (destroyed || !opened) return;
			try {
				await client.ensureInitialized();
				if (destroyed || !opened) return;
				await client.sendNotification("textDocument/didChange", {
					textDocument: { uri, version: ++version },
					contentChanges: [{ text: view.state.doc.toString() }],
				});
			} catch (error) {
				if (import.meta.env.DEV) {
					console.warn("surrealql language server: didChange failed", error);
				}
			}
		};

		const close = async () => {
			if (!opened) return;
			opened = false;
			try {
				await client.sendNotification("textDocument/didClose", {
					textDocument: { uri },
				});
			} catch {
				/* worker may already be torn down */
			}
		};

		const wireDiagnostics = () => {
			unsubscribe = client.onDiagnostics((targetUri, diagnostics) => {
				if (destroyed || targetUri !== uri) return;
				const list = (diagnostics as LspDiagnostic[] | null | undefined) ?? [];
				const cmDiagnostics = list
					.map((d) => convertDiagnostic(d, view.state))
					.filter((value): value is CmDiagnostic => value !== null);
				view.dispatch({ effects: setLspDiagnostics.of(cmDiagnostics) });
				forceLinting(view);

				if (onValidate) {
					const parseError = list.find((d) => d.code === "parse" && d.severity === 1);
					onValidate(parseError?.message ?? "");
				}
			});
		};

		const triggerOpen = () => {
			open().catch((error) => {
				if (import.meta.env.DEV) {
					console.warn("surrealql language server: didOpen failed", error);
				}
			});
		};

		triggerOpen();
		wireDiagnostics();

		// After a manual restart the new worker has no record of this
		// document; re-send `didOpen` so completions and diagnostics
		// resume without the user having to switch tabs.
		unsubscribeRestart = client.onRestart(() => {
			opened = false;
			version = 0;
			triggerOpen();
		});

		return {
			update(update: ViewUpdate) {
				if (needsContentToOpen && update.docChanged && update.state.doc.length > 0) {
					triggerOpen();
					return;
				}
				if (update.docChanged) {
					sendChange().catch(() => {
						/* surfaced inside sendChange */
					});
				}
			},
			destroy() {
				destroyed = true;
				unsubscribe?.();
				unsubscribeRestart?.();
				close().catch(() => {
					/* worker may already be torn down */
				});
			},
		};
	});
}

function completionSource({ client, uri }: SurqlLanguageServerOptions) {
	let latestRequestId = 0;
	let latestController: AbortController | null = null;

	return async (context: CompletionContext): Promise<CompletionResult | null> => {
		const word = context.matchBefore(/[\w$:.<>-]+/);
		if (!word && !context.explicit) return null;

		const requestId = ++latestRequestId;
		// Abort any previously in-flight completion so the worker
		// queue and pending RPC slot are freed immediately.
		latestController?.abort();
		const controller = new AbortController();
		latestController = controller;

		try {
			const result = await client.sendRequest<
				LspCompletionItem[] | { items: LspCompletionItem[] } | null
			>(
				"textDocument/completion",
				{
					textDocument: { uri },
					position: offsetToPosition(context.state, context.pos),
				},
				{ signal: controller.signal },
			);

			// Drop stale responses: a newer completion request was
			// issued (the user kept typing) or CodeMirror cancelled.
			if (requestId !== latestRequestId || context.aborted) {
				return null;
			}

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
		} catch (error) {
			if (import.meta.env.DEV && !isAbortError(error)) {
				console.warn("surrealql language server: completion failed", error);
			}
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

/**
 * LSP `Position.character` is defined in UTF-16 code units, which is
 * exactly how JavaScript indexes strings, so the conversion is a
 * straight subtraction. No code-point walk required.
 */
function offsetToPosition(state: EditorState, offset: number): LspPosition {
	const line = state.doc.lineAt(offset);
	return {
		line: line.number - 1,
		character: offset - line.from,
	};
}

function positionToOffset(state: EditorState, position: LspPosition): number {
	if (position.line < 0 || position.line >= state.doc.lines) {
		return state.doc.length;
	}
	const line = state.doc.line(position.line + 1);
	return Math.min(line.from + Math.max(position.character, 0), line.to);
}

/**
 * Render markdown content as a CodeMirror tooltip body.
 *
 * We avoid mounting a React component here (CodeMirror tooltips live
 * outside the app's React tree, so any provider-aware UI Kit
 * component renders blank) and instead pipe `marked` through
 * DOMPurify before assigning to `innerHTML`. That keeps hover content
 * safe even when it echoes back user-supplied `DEFINE … COMMENT`
 * strings from the database.
 */
function createInfoTooltip(markdown: string): HTMLElement {
	const dom = document.createElement("div");
	dom.className = "cm-tooltip-surql-lsp";
	const html = marked.parse(markdown, { breaks: true, async: false }) as string;
	dom.innerHTML = DOMPurify.sanitize(html, {
		USE_PROFILES: { html: true },
		// Markdown's `<a>` output is the only place we keep an attribute
		// that needs hardening; force every link to open safely.
		ADD_ATTR: ["target", "rel"],
	});
	for (const anchor of dom.querySelectorAll("a")) {
		anchor.setAttribute("target", "_blank");
		anchor.setAttribute("rel", "noopener noreferrer");
	}
	return dom;
}

// Re-export so callers don't have to import from `@codemirror/view`
// when they only want the extension shape.
export type { Extension };
