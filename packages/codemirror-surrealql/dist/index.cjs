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
                Array: language.continuedIndent({ except: /^\s*]/ })
            }),
            language.foldNodeProp.add({
                "Object Array": language.foldInside
            })
        ],
        wrap: common.parseMixed(node => {
            return node.name == "JavaScript" ? { parser: javascript.parser } : null;
        })
    }),
    languageData: {
        closeBrackets: { brackets: ["[", "{", '"', "'", "("] },
        indentOnInput: /^\s*[\]}]$/,
        commentTokens: { line: "--" },
    }
});
/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
function surrealql() {
    return new language.LanguageSupport(surrealqlLanguage);
}

exports.surrealql = surrealql;
exports.surrealqlLanguage = surrealqlLanguage;
