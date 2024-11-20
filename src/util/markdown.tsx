import { marked } from "marked";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { renderHighlighting } from "./highlighting";

marked.use({
	gfm: true,
	renderer: {
		code({ text, lang }) {
			const { colorScheme } = useInterfaceStore.getState();
			const { syntaxTheme } = useConfigStore.getState().settings.appearance;

			return lang
				? renderHighlighting(text, lang.toLowerCase(), colorScheme, syntaxTheme)
				: text;
		},
	},
});
