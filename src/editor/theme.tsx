import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t, tagHighlighter } from "@lezer/highlight";

/**
 * The official Surrealist editor color scheme
 */
export const colorTheme = (isLight?: boolean) =>
	syntaxHighlighting(isLight ? LIGHT_STYLE : DARK_STYLE, { fallback: true });

const DARK_STYLE = HighlightStyle.define(
	[
		{ tag: t.string, color: "#00ff6e" },
		{ tag: t.comment, color: "#737e98" },
		{ tag: t.number, color: "#00DBFF" },
		{ tag: t.variableName, color: "#ffd000" },
		{ tag: t.className, color: "#0084FF" },
		{ tag: [t.keyword, t.operator], color: "#ff009e" },
		{ tag: [t.punctuation, t.name], color: "#ffffff" },
		{ tag: [t.typeName, t.null, t.bool, t.literal], color: "#9D2FFF" },
		{ tag: t.function(t.name), color: "#ff9b67" },
	],
	{ themeType: "dark" },
);

const LIGHT_STYLE = HighlightStyle.define(
	[
		{ tag: t.string, color: "#00a547" },
		{ tag: t.comment, color: "#737e98" },
		{ tag: t.number, color: "#00b3d0" },
		{ tag: t.variableName, color: "#b82e2e" },
		{ tag: t.className, color: "#0084FF" },
		{ tag: [t.keyword, t.operator], color: "#ff009e" },
		{ tag: [t.punctuation, t.name], color: "#000000" },
		{ tag: [t.typeName, t.null, t.bool, t.literal], color: "#9D2FFF" },
		{ tag: t.function(t.name), color: "#e36d00" },
	],
	{ themeType: "light" },
);

/**
 * A class-based highlighter using the Surrealist editor color scheme
 */
export const CLASS_HIGHLIGHTER = tagHighlighter(
	DARK_STYLE.specs.map((a) => ({ ...a, class: a.color })),
);
