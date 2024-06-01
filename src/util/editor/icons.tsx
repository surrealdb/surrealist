import { mdiFunction, mdiTable, mdiVariable } from "@mdi/js";

type TypeIcon = { type: string; icon: string; color: string; }

const TYPE_ICONS: TypeIcon[] = [
	{ type: "variable", icon: mdiVariable, color: "#ffde00" },	// Params
	{ type: "function", icon: mdiFunction, color: "#ff9b67" },	// Functions
	{ type: "class", icon: mdiTable, color: "#FF00A0" },		// Tables

	// { type: "text", icon: mdiText, color: "#F59F00" },
	// { type: "type", icon: mdiCodeBrackets, color: "#F59F00" },
	// { type: "keyword", icon: mdiKeyVariant, color: "#F59F00" },
	// { type: "constant", icon: mdiPackageVariantClosed, color: "#F59F00" },
	// { type: "enum", icon: mdiPackageVariantClosed, color: "#F59F00" },
	// { type: "interface", icon: mdiPackageVariantClosed, color: "#F59F00" },
	// { type: "method", icon: mdiPackageVariantClosed, color: "#F59F00" },
	// { type: "namespace", icon: mdiPackageVariantClosed, color: "#F59F00" },
	// { type: "property", icon: mdiPackageVariantClosed, color: "#F59F00" },
];

/**
 * Generate and insert custom completion icon styles
 */
export function generateEditorIcons() {
	const definitions = TYPE_ICONS.map((info, type) => {
		const svg = btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${info.icon}" fill="${info.color}" stroke="${info.color}" stroke-width="0.75"></path></svg>`);

		return `\t--surrealist-editor-icon-${info.type}: url('data:image/svg+xml;base64,${svg}')`;
	});

	const css = `:root {\n${definitions.join(';\n')}}`;
	const style = document.createElement("style");
	const text = document.createTextNode(css);

	style.setAttribute("type", "text/css");
	style.setAttribute("media", "screen");
	style.setAttribute("class", "surrealist-editor-icons");
	style.append(text);

	document.head.append(style);
}
