import { marked } from "marked";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import classes from "~/styles/markdown.module.css";
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
		image({ href, title, text }) {
			return `
				<div class="${classes.markdownImage}">
					<img
						src="${href}"
						alt="${text}"
						title="${title}"
					/>
				</div>
			`;
		},
	},
});
