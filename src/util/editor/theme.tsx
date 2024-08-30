import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * The dark syntax highlighting style
 */
export const DARK_STYLE = HighlightStyle.define([
	{ tag: t.string, color: "#00ff6e" },
	{ tag: t.comment, color: "#737e98" },
	{ tag: t.propertyName, color: "#e06c75" },
	{ tag: t.className, color: "#00d1ff" },
	{ tag: t.variableName, color: "#ffd000" },
	{ tag: [t.keyword, t.operator], color: "#ff009e" },
	{ tag: [t.punctuation, t.name], color: "#ffffff" },
	{ tag: [t.typeName, t.null, t.bool, t.literal], color: "#a79fff" },
	{ tag: [t.function(t.name), t.number], color: "#ff9b67" },
], { themeType: 'dark' });

/**
 * The light syntax highlighting style
 */
export const LIGHT_STYLE = HighlightStyle.define([
	{ tag: t.operator, color: "#7f73ff" },
	{ tag: t.string, color: "#00a547" },
	{ tag: t.comment, color: "#737e98" },
	{ tag: t.propertyName, color: "#b80000" },
	{ tag: t.className, color: "#0097ff" },
	{ tag: t.variableName, color: "#6c00a7" },
	{ tag: [t.keyword, t.operator], color: "#ff009e" },
	{ tag: [t.punctuation, t.name], color: "#000000" },
	{ tag: [t.typeName, t.null, t.bool, t.literal], color: "#8d6bff" },
	{ tag: [t.function(t.name), t.number], color: "#e36d00" },
], { themeType: 'light' });