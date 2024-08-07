'use strict';

var lezerSurrealql = require('lezer-surrealql');
var language = require('@codemirror/language');
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
const defaultLanguage = surrealqlLanguage.configure({
    top: "SurrealQL",
});
const permissionInputLanguage = surrealqlLanguage.configure({
    top: "PermissionInput",
});
const combinedResultsLanguage = surrealqlLanguage.configure({
    top: "CombinedResults",
});
/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
function surrealql(scope = "default") {
    return new language.LanguageSupport(scope === "permission"
        ? permissionInputLanguage
        : scope === "combined-results"
            ? combinedResultsLanguage
            : defaultLanguage);
}

exports.surrealql = surrealql;
exports.surrealqlLanguage = surrealqlLanguage;
