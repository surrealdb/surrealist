import { LRLanguage, LanguageSupport } from '@codemirror/language';

declare const surrealqlLanguage: LRLanguage;
/**
 * The CodeMirror extension used to add support for the SurrealQL language
 */
declare function surrealql(): LanguageSupport;

export { surrealql, surrealqlLanguage };
