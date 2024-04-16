import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * The dark syntax highlighting style
 */
export const DARK_STYLE = HighlightStyle.define([
	{ tag: t.keyword, color: "#ff009e" },
	{ tag: t.operator, color: "#ff00ff" },
	{ tag: t.number, color: "#00dbff" },
	{ tag: t.string, color: "#00ff6e" },
	{ tag: t.comment, color: "#737e98" },
	{ tag: t.propertyName, color: "#e06c75" },
	{ tag: t.variableName, color: "#ffde00" },
	{ tag: t.punctuation, color: "#ffffff" },
	{ tag: t.function(t.name), color: "#ff9b67" },
	{ tag: t.null, color: "#9d2fff" },
	{ tag: t.bool, color: "#9d2fff" },
	{ tag: t.name, color: "#ffffff" },
	{ tag: t.typeName, color: "#ffde00" },
	{ tag: t.literal, color: "#9d2fff" },
	{ tag: t.className, color: "#0084ff" },
], { themeType: 'dark' });

/**
 * The light syntax highlighting style
 */
export const LIGHT_STYLE = HighlightStyle.define([
	{ tag: t.keyword, color: "#ff009e" },
	{ tag: t.operator, color: "#ff00ff" },
	{ tag: t.number, color: "#00dbff" },
	{ tag: t.string, color: "#68DE74" },
	{ tag: t.comment, color: "#737e98" },
	{ tag: t.propertyName, color: "#e06c75" },
	{ tag: t.variableName, color: "#ffc845" },
	{ tag: t.punctuation, color: "#000000" },
	{ tag: t.function(t.name), color: "#ff9b67" },
	{ tag: t.null, color: "#9d2fff" },
	{ tag: t.bool, color: "#9d2fff" },
	{ tag: t.name, color: "#000000" },
	{ tag: t.typeName, color: "#ffc845" },
	{ tag: t.literal, color: "#9d2fff" },
	{ tag: t.className, color: "#0084ff" },
], { themeType: 'light' });
