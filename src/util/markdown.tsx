import { marked } from "marked";
import { renderHighlighting } from "./surrealql";
import { useInterfaceStore } from "~/stores/interface";

marked.use({
	gfm: true,
	renderer: {
		code({ text, lang }) {
			const { colorScheme } = useInterfaceStore.getState();

			return renderHighlighting(text, colorScheme);
		},
	},
});
