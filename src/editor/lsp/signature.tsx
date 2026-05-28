/**
 * CodeMirror 6 extension that surfaces `textDocument/signatureHelp`
 * results as a small inline tooltip.
 *
 * CodeMirror has no first-party signature-help support, so we glue
 * one together: a `StateField` provides the tooltip via the
 * `showTooltip` facet, a `ViewPlugin` watches the buffer for
 * `(`/`,`/cursor moves and dispatches `StateEffect`s with the latest
 * server response.
 */

import { StateEffect, StateField } from "@codemirror/state";
import { showTooltip, type Tooltip, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { SurqlLspClient } from "./client";

interface LspParameterInformation {
	label: string | [number, number];
	documentation?: string | { kind: string; value: string };
}

interface LspSignatureInformation {
	label: string;
	documentation?: string | { kind: string; value: string };
	parameters?: LspParameterInformation[];
	activeParameter?: number;
}

interface LspSignatureHelp {
	signatures: LspSignatureInformation[];
	activeSignature?: number;
	activeParameter?: number;
}

interface SignatureState {
	help: LspSignatureHelp;
	pos: number;
}

const setSignatureState = StateEffect.define<SignatureState | null>();

const signatureField = StateField.define<Tooltip | null>({
	create: () => null,
	update(value, tr) {
		for (const effect of tr.effects) {
			if (effect.is(setSignatureState)) {
				value = effect.value ? buildTooltip(effect.value) : null;
			}
		}
		return value;
	},
	provide: (field) => showTooltip.from(field),
});

const SIGNATURE_DEBOUNCE_MS = 150;

interface SignatureHelpOptions {
	client: SurqlLspClient;
	uri: string;
}

export function signatureHelpExtension(options: SignatureHelpOptions) {
	return [signatureField, signatureHelpPlugin(options)];
}

function signatureHelpPlugin({ client, uri }: SignatureHelpOptions) {
	return ViewPlugin.define((view) => {
		let timer: ReturnType<typeof setTimeout> | null = null;
		let latestRequestId = 0;

		const request = async () => {
			const requestId = ++latestRequestId;
			const head = view.state.selection.main.head;
			const line = view.state.doc.lineAt(head);

			try {
				const response = await client.sendRequest<LspSignatureHelp | null>(
					"textDocument/signatureHelp",
					{
						textDocument: { uri },
						position: {
							line: line.number - 1,
							character: head - line.from,
						},
					},
				);

				if (requestId !== latestRequestId) return;

				if (!response || response.signatures.length === 0) {
					view.dispatch({ effects: setSignatureState.of(null) });
					return;
				}

				view.dispatch({
					effects: setSignatureState.of({ help: response, pos: head }),
				});
			} catch (error) {
				if (import.meta.env.DEV) {
					const name =
						typeof error === "object" && error && "name" in error
							? (error as { name: string }).name
							: undefined;
					if (name !== "AbortError") {
						console.warn("surrealql language server: signatureHelp failed", error);
					}
				}
				view.dispatch({ effects: setSignatureState.of(null) });
			}
		};

		const schedule = () => {
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				void request();
			}, SIGNATURE_DEBOUNCE_MS);
		};

		const dismiss = () => {
			if (view.state.field(signatureField, false)) {
				view.dispatch({ effects: setSignatureState.of(null) });
			}
		};

		return {
			update(update: ViewUpdate) {
				if (!update.docChanged && !update.selectionSet) return;

				if (update.docChanged) {
					// Look at the last inserted character — `(` and `,`
					// are the canonical (re)trigger characters; anything
					// else just moves the active signature/parameter.
					let triggered = false;
					update.changes.iterChanges((_fromA, _toA, _fromB, _toB, inserted) => {
						const text = inserted.toString();
						if (text.includes("(") || text.includes(",")) {
							triggered = true;
						}
					});

					if (triggered) {
						schedule();
						return;
					}
				}

				if (update.state.field(signatureField, false)) {
					// Tooltip is already visible — keep it in sync as the
					// user types or moves the cursor.
					schedule();
				}

				// If the cursor escaped the open call (e.g. moved past a
				// matching `)`), drop the tooltip on the next pulse.
				if (
					update.selectionSet &&
					!update.docChanged &&
					update.state.field(signatureField, false)
				) {
					if (cursorOutsideCall(update)) {
						dismiss();
					}
				}
			},
			destroy() {
				if (timer !== null) clearTimeout(timer);
			},
		};
	});
}

function cursorOutsideCall(update: ViewUpdate): boolean {
	const head = update.state.selection.main.head;
	const line = update.state.doc.lineAt(head);
	const before = line.text.slice(0, head - line.from);
	const lastOpen = before.lastIndexOf("(");
	const lastClose = before.lastIndexOf(")");
	return lastOpen < 0 || lastClose > lastOpen;
}

function buildTooltip(state: SignatureState): Tooltip {
	return {
		pos: state.pos,
		above: true,
		strictSide: false,
		arrow: false,
		create: () => ({ dom: renderSignature(state.help) }),
	};
}

function renderSignature(help: LspSignatureHelp): HTMLElement {
	const container = document.createElement("div");
	container.className = "cm-tooltip-surql-lsp cm-tooltip-surql-signature";

	const activeSignatureIndex = clampIndex(help.activeSignature ?? 0, help.signatures.length);
	const signature = help.signatures[activeSignatureIndex];
	if (!signature) return container;

	const activeParameterIndex = clampIndex(
		signature.activeParameter ?? help.activeParameter ?? 0,
		signature.parameters?.length ?? 0,
	);

	const sigEl = document.createElement("div");
	sigEl.className = "cm-tooltip-surql-signature__label";
	sigEl.append(...renderSignatureLabel(signature, activeParameterIndex));
	container.appendChild(sigEl);

	const activeParam = signature.parameters?.[activeParameterIndex];
	if (activeParam) {
		const docs = paramDocs(activeParam) ?? signatureDocs(signature);
		if (docs) {
			const docEl = document.createElement("div");
			docEl.className = "cm-tooltip-surql-signature__doc";
			docEl.textContent = docs;
			container.appendChild(docEl);
		}
	}

	return container;
}

function renderSignatureLabel(
	signature: LspSignatureInformation,
	activeParameterIndex: number,
): Node[] {
	const label = signature.label;
	const params = signature.parameters ?? [];
	const activeParam = params[activeParameterIndex];

	if (!activeParam) {
		return [document.createTextNode(label)];
	}

	const range = parameterRange(label, activeParam);
	if (!range) {
		return [document.createTextNode(label)];
	}

	const [start, end] = range;
	const before = document.createTextNode(label.slice(0, start));
	const active = document.createElement("span");
	active.className = "cm-tooltip-surql-signature__param-active";
	active.textContent = label.slice(start, end);
	const after = document.createTextNode(label.slice(end));

	return [before, active, after];
}

function parameterRange(label: string, param: LspParameterInformation): [number, number] | null {
	if (typeof param.label === "string") {
		const idx = label.indexOf(param.label);
		return idx >= 0 ? [idx, idx + param.label.length] : null;
	}
	const [start, end] = param.label;
	if (start < 0 || end > label.length || start >= end) return null;
	return [start, end];
}

function paramDocs(param: LspParameterInformation): string | null {
	if (typeof param.documentation === "string") return param.documentation;
	return param.documentation?.value ?? null;
}

function signatureDocs(signature: LspSignatureInformation): string | null {
	if (typeof signature.documentation === "string") return signature.documentation;
	return signature.documentation?.value ?? null;
}

function clampIndex(index: number, length: number): number {
	if (length <= 0) return 0;
	if (index < 0) return 0;
	if (index >= length) return length - 1;
	return index;
}
