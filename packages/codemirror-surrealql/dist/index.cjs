'use strict';

var language = require('@codemirror/language');
var lezerSurrealql = require('lezer-surrealql');
var common = require('@lezer/common');
var javascript = require('@lezer/javascript');

const surrealqlLanguage = language.LRLanguage.define({
    name: "surrealql",
    parser: lezerSurrealql.parser.configure({
        props: [
            language.indentNodeProp.add({
                Object: language.continuedIndent({ except: /^\s*}/ }),
                Array: language.continuedIndent({ except: /^\s*]/ }),
            }),
            language.foldNodeProp.add({
                "Object Array CombinedResult": language.foldInside,
            }),
        ],
        wrap: common.parseMixed((node) => {
            return node.name === "JavaScriptContent" ? { parser: javascript.parser } : null;
        }),
    }),
    languageData: {
        closeBrackets: { brackets: ["[", "{", '"', "'", "("] },
        indentOnInput: /^\s*[\]}]$/,
        commentTokens: { line: "--" },
    },
});
const languageMap = new Map([
    ["default", surrealqlLanguage.configure({ top: "SurrealQL" })],
    ["permission", surrealqlLanguage.configure({ top: "PermissionInput" })],
    ["combined-results", surrealqlLanguage.configure({ top: "CombinedResults" })],
]);
/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
function surrealql(scope = "default") {
    const language$1 = languageMap.get(scope);
    if (!language$1) {
        throw new Error(`Unknown language scope: ${scope}`);
    }
    return new language.LanguageSupport(language$1);
}

exports.surrealql = surrealql;
exports.surrealqlLanguage = surrealqlLanguage;
