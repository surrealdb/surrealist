import { marked } from "marked";
import { useInterfaceStore } from "~/stores/interface";
import { renderHighlighting } from "./surrealql";

// const LINK_PATTERN = /^(.+?)\|(\d+)$/;

marked.use({
	gfm: true,
	renderer: {
		code({ text }) {
			const { colorScheme } = useInterfaceStore.getState();

			return renderHighlighting(text, colorScheme);
		},
		// link({ href, title, text }) {
		// 	const [full, clean, source] = href.match(LINK_PATTERN) ?? [];

		// 	if (full) {
		// 		const isSame = href === text;
		// 		return `<a href="${clean}" title="${title}" target="_blank">${isSame ? clean : text}</a><sup>${source}</sup>`;
		// 	}

		// 	return `<a href="${href}" title="${title}" target="_blank">${text}</a>`;
		// },
	},
});
