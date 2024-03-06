import { HighlightStyle } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

/**
 * The light syntax highlighting style
 */
export const LIGHT_STYLE = HighlightStyle.define([
	{ tag: t.keyword, color: "#e600a4" },
	{ tag: t.operator, color: "#e600a4" },
	{ tag: t.number, color: "#d19a66" },
	{ tag: t.string, color: "#98c379" },
	{ tag: t.comment, color: "#5c6370" },
	{ tag: t.propertyName, color: "#e06c75" },
	{ tag: t.variableName, color: "#E06C75" },
	{ tag: t.punctuation, color: "#abb2bf" },
	{ tag: t.function(t.name), color: "#56b6c2" },
	{ tag: t.null, color: "#56b6c2" },
	{ tag: t.bool, color: "#56b6c2" },
	{ tag: t.name, color: "#c2c2c2" },
], { themeType: 'light' });

/**
 * The dark syntax highlighting style
 */
export const DARK_STYLE = HighlightStyle.define([
	{ tag: t.keyword, color: "#e600a4" },
	{ tag: t.operator, color: "#e600a4" },
	{ tag: t.number, color: "#d19a66" },
	{ tag: t.string, color: "#98c379" },
	{ tag: t.comment, color: "#5c6370" },
	{ tag: t.propertyName, color: "#e06c75" },
	{ tag: t.variableName, color: "#E06C75" },
	{ tag: t.punctuation, color: "#abb2bf" },
	{ tag: t.function(t.name), color: "#56b6c2" },
	{ tag: t.null, color: "#56b6c2" },
	{ tag: t.bool, color: "#56b6c2" },
	{ tag: t.name, color: "#c2c2c2" },
], { themeType: 'dark' });