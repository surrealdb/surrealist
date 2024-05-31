import {
	LRLanguage,
	LanguageSupport,
	continuedIndent,
	foldInside,
	foldNodeProp,
	indentNodeProp,
} from "@codemirror/language";
import { parseMixed } from "@lezer/common";
import { parser as parser$1 } from "@lezer/javascript";
import { parser } from "lezer-surrealql";

const surrealqlLanguage = /*@__PURE__*/ LRLanguage.define({
	name: "surrealql",
	parser: /*@__PURE__*/ parser.configure({
		props: [
			/*@__PURE__*/ indentNodeProp.add({
				Object: /*@__PURE__*/ continuedIndent({ except: /^\s*}/ }),
				Array: /*@__PURE__*/ continuedIndent({ except: /^\s*]/ }),
			}),
			/*@__PURE__*/ foldNodeProp.add({
				"Object Array": foldInside,
			}),
		],
		wrap: /*@__PURE__*/ parseMixed((node) => {
			return node.name == "JavaScript" ? { parser: parser$1 } : null;
		}),
	}),
	languageData: {
		closeBrackets: { brackets: ["[", "{", '"', "'", "("] },
		indentOnInput: /^\s*[\]}]$/,
		commentTokens: { line: "--" },
	},
});
const defaultLanguage = /*@__PURE__*/ surrealqlLanguage.configure({
	top: "SurrealQL",
});
const permissionInputLanguage = /*@__PURE__*/ surrealqlLanguage.configure({
	top: "PermissionInput",
});
/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
function surrealql(scope = "default") {
	return new LanguageSupport(
		scope === "permission" ? permissionInputLanguage : defaultLanguage,
	);
}

export { surrealql, surrealqlLanguage };
