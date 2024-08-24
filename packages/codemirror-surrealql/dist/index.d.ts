import { LRLanguage, LanguageSupport } from '@codemirror/language';

declare const surrealqlLanguage: LRLanguage;
type Scope = "default" | "permission" | "combined-results";
/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
declare function surrealql(scope?: Scope): LanguageSupport;

export { surrealql, surrealqlLanguage };
