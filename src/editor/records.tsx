import { syntaxTree } from "@codemirror/language";
import { Extension, Prec, RangeSetBuilder } from "@codemirror/state";
import { Decoration, EditorView } from "@codemirror/view";
import { isModKey } from "~/util/helpers";

type RecordLinkCallback = (link: string) => void;

const RECORD_LINK_MARK = Decoration.mark({
	class: "cm-record-link",
	attributes: {
		title: "Cmd/Ctrl + Click to open record"
	}
});

const RECORD_LINK_DECORATOR = (view: EditorView) => {
	const builder = new RangeSetBuilder<Decoration>();
	const tree = syntaxTree(view.state);

	tree.iterate({
		enter(node) {
			if (node.type.name === "RecordId") {
				builder.add(node.from, node.to, RECORD_LINK_MARK);
			}
		}
	});

	return builder.finish();
};

/**
 * An extension used to highlight record links
 */
export const surqlRecordLinks = (onClick: RecordLinkCallback): Extension => [
	EditorView.decorations.of(RECORD_LINK_DECORATOR),
	Prec.highest(EditorView.domEventHandlers({
		mousedown: (event, view) => {
			if (!isModKey(event))
				return false;

			const pos = view.posAtDOM(event.target as HTMLElement);
			let token = syntaxTree(view.state).resolveInner(pos, 1);

			while (token && (token.name !== "RecordId")) {
				token = token.parent as any;
			}

			if (token) {
				const link = view.state.sliceDoc(token.from, token.to);

				if (link) {
					onClick(link);
					return true;
				}
			}
		}
	}))
];