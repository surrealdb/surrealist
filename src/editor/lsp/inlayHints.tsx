/**
 * CodeMirror 6 extension that requests `textDocument/inlayHint` for
 * the visible viewport and renders the results as inline widget
 * decorations.
 *
 * Hints are debounced and viewport-scoped to avoid request storms
 * during scrolling. Once we've fetched a hint set we keep showing it
 * until the next refresh — that way scrolling doesn't briefly blank
 * the gutter while a request is in flight.
 */

import {
	type EditorState,
	RangeSet,
	RangeSetBuilder,
	StateEffect,
	StateField,
} from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	EditorView,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import type { SurqlLspClient } from "./client";

interface LspPosition {
	line: number;
	character: number;
}

interface LspInlayHintLabelPart {
	value: string;
}

interface LspInlayHint {
	position: LspPosition;
	label: string | LspInlayHintLabelPart[];
	kind?: number;
	paddingLeft?: boolean;
	paddingRight?: boolean;
}

interface InlayHintOptions {
	client: SurqlLspClient;
	uri: string;
}

const setHints = StateEffect.define<DecorationSet>();
const clearHints = StateEffect.define<null>();

const hintsField = StateField.define<DecorationSet>({
	create: () => Decoration.none,
	update(value, tr) {
		value = value.map(tr.changes);
		for (const effect of tr.effects) {
			if (effect.is(setHints)) value = effect.value;
			if (effect.is(clearHints)) value = Decoration.none;
		}
		return value;
	},
	provide: (field) => EditorView.decorations.from(field),
});

const REFRESH_DEBOUNCE_MS = 200;

class InlayHintWidget extends WidgetType {
	constructor(
		private readonly text: string,
		private readonly paddingLeft: boolean,
		private readonly paddingRight: boolean,
	) {
		super();
	}

	override eq(other: WidgetType): boolean {
		return (
			other instanceof InlayHintWidget &&
			other.text === this.text &&
			other.paddingLeft === this.paddingLeft &&
			other.paddingRight === this.paddingRight
		);
	}

	toDOM(): HTMLElement {
		const el = document.createElement("span");
		el.className = "cm-inlay-hint";
		el.textContent = this.text;
		if (this.paddingLeft) el.style.marginLeft = "4px";
		if (this.paddingRight) el.style.marginRight = "4px";
		return el;
	}

	override ignoreEvent(): boolean {
		return true;
	}
}

export function inlayHintsExtension(options: InlayHintOptions) {
	return [hintsField, inlayHintsPlugin(options)];
}

function inlayHintsPlugin({ client, uri }: InlayHintOptions) {
	return ViewPlugin.define((view) => {
		let timer: ReturnType<typeof setTimeout> | null = null;
		let latestRequestId = 0;
		let lastViewportFrom = -1;
		let lastViewportTo = -1;

		const refresh = async () => {
			const requestId = ++latestRequestId;
			const { from, to } = view.viewport;
			lastViewportFrom = from;
			lastViewportTo = to;

			try {
				const hints = await client.sendRequest<LspInlayHint[] | null>(
					"textDocument/inlayHint",
					{
						textDocument: { uri },
						range: {
							start: offsetToPosition(view.state, from),
							end: offsetToPosition(view.state, to),
						},
					},
				);

				if (requestId !== latestRequestId) return;

				const decorations = buildDecorations(view.state, hints ?? []);
				view.dispatch({ effects: setHints.of(decorations) });
			} catch (error) {
				if (import.meta.env.DEV) {
					const name =
						typeof error === "object" && error && "name" in error
							? (error as { name: string }).name
							: undefined;
					if (name !== "AbortError") {
						console.warn("surrealql language server: inlayHint failed", error);
					}
				}
				view.dispatch({ effects: clearHints.of(null) });
			}
		};

		const schedule = () => {
			if (timer !== null) clearTimeout(timer);
			timer = setTimeout(() => {
				timer = null;
				void refresh();
			}, REFRESH_DEBOUNCE_MS);
		};

		schedule();

		return {
			update(update: ViewUpdate) {
				const { from, to } = update.view.viewport;
				const viewportShifted = from !== lastViewportFrom || to !== lastViewportTo;
				if (update.docChanged || viewportShifted) {
					schedule();
				}
			},
			destroy() {
				if (timer !== null) clearTimeout(timer);
			},
		};
	});
}

function buildDecorations(state: EditorState, hints: LspInlayHint[]): DecorationSet {
	const sorted = hints
		.map((hint) => ({
			hint,
			pos: positionToOffset(state, hint.position),
		}))
		.filter(({ pos }) => Number.isFinite(pos))
		.sort((a, b) => a.pos - b.pos);

	const builder = new RangeSetBuilder<Decoration>();
	for (const { hint, pos } of sorted) {
		const text = labelToText(hint.label);
		if (!text) continue;
		builder.add(
			pos,
			pos,
			Decoration.widget({
				widget: new InlayHintWidget(
					text,
					hint.paddingLeft ?? false,
					hint.paddingRight ?? false,
				),
				side: -1,
			}),
		);
	}
	return builder.finish() as RangeSet<Decoration>;
}

function labelToText(label: LspInlayHint["label"]): string {
	if (typeof label === "string") return label;
	return label.map((part) => part.value).join("");
}

function offsetToPosition(state: EditorState, offset: number): LspPosition {
	const line = state.doc.lineAt(offset);
	return { line: line.number - 1, character: offset - line.from };
}

function positionToOffset(state: EditorState, position: LspPosition): number {
	if (position.line < 0 || position.line >= state.doc.lines) {
		return state.doc.length;
	}
	const line = state.doc.line(position.line + 1);
	return Math.min(line.from + Math.max(position.character, 0), line.to);
}
