import { iconFunction, iconTable, iconVariable } from "../util/icons";

type TypeIcon = { type: string; icon: string; color: string };

const TYPE_ICONS: TypeIcon[] = [
	{ type: "variable", icon: iconVariable, color: "#ffde00" }, // Params
	{ type: "function", icon: iconFunction, color: "#ff9b67" }, // Functions
	{ type: "class", icon: iconTable, color: "#FF00A0" }, // Tables
];

/**
 * Generate and insert custom completion icon styles
 */
export function generateEditorIcons() {
	const definitions = TYPE_ICONS.map((info) => {
		const svg = btoa(
			`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${info.icon}" fill="${info.color}" stroke="${info.color}" stroke-width="0.75"></path></svg>`,
		);

		return `\t--surrealist-editor-icon-${info.type}: url('data:image/svg+xml;base64,${svg}')`;
	});

	const css = `:root {\n${definitions.join(";\n")}}`;
	const style = document.createElement("style");
	const text = document.createTextNode(css);

	style.setAttribute("type", "text/css");
	style.setAttribute("media", "screen");
	style.setAttribute("class", "surrealist-editor-icons");
	style.append(text);

	document.head.append(style);
}
