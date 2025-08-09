import { StreamLanguage } from "@codemirror/language";
import { csharp, java } from "@codemirror/legacy-modes/mode/clike";
import { parser as bashParser } from "@fig/lezer-bash";
import { parser as goParser } from "@lezer/go";
import { highlightCode } from "@lezer/highlight";
import { parser as htmlParser } from "@lezer/html";
import { parser as jsParser } from "@lezer/javascript";
import { parser as jsonParser } from "@lezer/json";
import { parser as phpParser } from "@lezer/php";
import { parser as pyParser } from "@lezer/python";
import { parser as rustParser } from "@lezer/rust";
import { parser as yamlParser } from "@lezer/yaml";
import { parser as surqlParser } from "@surrealdb/lezer";
import { adapter } from "~/adapter";
import { createStyleHighlighter } from "~/editor";
import type { ColorScheme, SyntaxTheme } from "~/types";

type Parser = { parse: (code: string) => any };

const csharpParser = StreamLanguage.define(csharp).parser;
const javaParser = StreamLanguage.define(java).parser;

const PARSER_MAP = new Map<string, Parser>([
	["sh", bashParser],
	["bash", bashParser],
	["cs", csharpParser],
	["csharp", csharpParser],
	["rs", rustParser],
	["rust", rustParser],
	["js", jsParser],
	["ts", jsParser],
	["jsx", jsParser],
	["tsx", jsParser],
	["javascript", jsParser],
	["typescript", jsParser],
	["sql", surqlParser],
	["surql", surqlParser],
	["surrealql", surqlParser],
	["json", jsonParser],
	["yaml", yamlParser],
	["java", javaParser],
	["go", goParser],
	["py", pyParser],
	["python", pyParser],
	["html", htmlParser],
	["cli", surqlParser],
	["php", phpParser.configure({ top: "Program" })],
	["syntax", surqlParser.configure({ top: "Syntax" })],
]);

/**
 * Render a query with syntax highlighting
 *
 * @param code The query to render
 * @param language The language of the query
 * @param colorScheme The color scheme to use
 * @param syntaxTheme The syntax theme to use
 * @returns Highlighted HTML
 */
export function renderHighlighting(
	code: string,
	language: string | undefined,
	colorScheme: ColorScheme,
	syntaxTheme: SyntaxTheme,
) {
	const parser = PARSER_MAP.get(language as any);

	if (!parser) {
		adapter.warn("Highlight", `Unsupported language: ${language}`);
		return `<pre>${code}</pre>`;
	}

	const rendered = document.createElement("pre");
	const textColor = colorScheme === "dark" ? "#c9c9c9" : "#000000";

	function emit(text: string, classes?: string) {
		const textNode = document.createTextNode(text);
		const span = document.createElement("span");

		if (classes) {
			span.style.color = classes;
		} else {
			span.style.color = textColor;
		}

		span.append(textNode);
		rendered.append(span);
	}

	function emitBreak() {
		emit("\n");
	}

	highlightCode(
		code,
		parser.parse(code),
		createStyleHighlighter(colorScheme, syntaxTheme),
		emit,
		emitBreak,
	);

	return rendered.outerHTML;
}
