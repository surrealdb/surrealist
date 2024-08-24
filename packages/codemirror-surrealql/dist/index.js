import { LRLanguage, indentNodeProp, continuedIndent, foldNodeProp, foldInside, LanguageSupport } from '@codemirror/language';
import { parser } from 'lezer-surrealql';
import { parseMixed } from '@lezer/common';
import { parser as parser$1 } from '@lezer/javascript';

const surrealqlLanguage = /*@__PURE__*/LRLanguage.define({
    name: "surrealql",
    parser: /*@__PURE__*/parser.configure({
        props: [
            /*@__PURE__*/indentNodeProp.add({
                Object: /*@__PURE__*/continuedIndent({ except: /^\s*}/ }),
                Array: /*@__PURE__*/continuedIndent({ except: /^\s*]/ }),
            }),
            /*@__PURE__*/foldNodeProp.add({
                "Object Array CombinedResult": foldInside,
            }),
        ],
        wrap: /*@__PURE__*/parseMixed((node) => {
            return node.name === "JavaScriptContent" ? { parser: parser$1 } : null;
        }),
    }),
    languageData: {
        closeBrackets: { brackets: ["[", "{", '"', "'", "("] },
        indentOnInput: /^\s*[\]}]$/,
        commentTokens: { line: "--" },
    },
});
const languageMap = /*@__PURE__*/new Map([
    ["default", /*@__PURE__*/surrealqlLanguage.configure({ top: "SurrealQL" })],
    ["permission", /*@__PURE__*/surrealqlLanguage.configure({ top: "PermissionInput" })],
    ["combined-results", /*@__PURE__*/surrealqlLanguage.configure({ top: "CombinedResults" })],
]);
/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
function surrealql(scope = "default") {
    const language = languageMap.get(scope);
    if (!language) {
        throw new Error(`Unknown language scope: ${scope}`);
    }
    return new LanguageSupport(language);
}

export { surrealql, surrealqlLanguage };
