import {
	continuedIndent,
	indentNodeProp,
	foldNodeProp,
	foldInside,
	LRLanguage,
	LanguageSupport,
} from "@codemirror/language";

import { parser } from "lezer-surrealql";
import { parseMixed } from "@lezer/common";
import { parser as jsParser } from "@lezer/javascript";

export const surrealqlLanguage = LRLanguage.define({
	name: "surrealql",
	parser: parser.configure({
		props: [
			indentNodeProp.add({
				Object: continuedIndent({ except: /^\s*}/ }),
				Array: continuedIndent({ except: /^\s*]/ }),
			}),
			foldNodeProp.add({
				"Object Array CombinedResult": foldInside,
			}),
		],
		wrap: parseMixed((node) => {
			return node.name === "JavaScriptContent" ? { parser: jsParser } : null;
		}),
	}),
	languageData: {
		closeBrackets: { brackets: ["[", "{", '"', "'", "("] },
		indentOnInput: /^\s*[\]}]$/,
		commentTokens: { line: "--" },
	},
});

type Scope = "default" | "permission" | "combined-results";

const languageMap = new Map<Scope, LRLanguage>([
	["default", surrealqlLanguage.configure({ top: "SurrealQL" })],
	["permission", surrealqlLanguage.configure({ top: "PermissionInput" })],
	["combined-results", surrealqlLanguage.configure({ top: "CombinedResults" })],
]);

/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
export function surrealql(scope: Scope = "default") {
	const language = languageMap.get(scope);

	if (!language) {
		throw new Error(`Unknown language scope: ${scope}`);
	}

	return new LanguageSupport(language);
}
