import { mdiCodeBrackets, mdiFunction, mdiKeyVariant, mdiPackageVariantClosed, mdiTable, mdiText, mdiVariable } from "@mdi/js";

type TypeIcon = { type: string; icon: string; color: string; }

const TYPE_ICONS: TypeIcon[] = [
	{ type: "text", icon: mdiText, color: "#6a6a7b" },
	{ type: "type", icon: mdiCodeBrackets, color: "#339AF0" },
	{ type: "variable", icon: mdiVariable, color: "#FA5252" },
	{ type: "keyword", icon: mdiKeyVariant, color: "#ff00a0" },
	{ type: "function", icon: mdiFunction, color: "#22B8CF" },
	{ type: "class", icon: mdiTable, color: "#22B8CF" },

	{ type: "constant", icon: mdiPackageVariantClosed, color: "#F59F00" },
	{ type: "enum", icon: mdiPackageVariantClosed, color: "#F59F00" },
	{ type: "interface", icon: mdiPackageVariantClosed, color: "#F59F00" },
	{ type: "method", icon: mdiPackageVariantClosed, color: "#F59F00" },
	{ type: "namespace", icon: mdiPackageVariantClosed, color: "#F59F00" },
	{ type: "property", icon: mdiPackageVariantClosed, color: "#F59F00" },
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
