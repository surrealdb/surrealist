import { styleTags, tags as t } from "@lezer/highlight"

export const surqlHighlighting = styleTags({
	"Ident": t.name,
	"Keyword": t.keyword,
	"String": t.string,
	"Int Float Decimal VersionNumber Duration": t.number,
	"Bool": t.bool,
	"Comment": t.lineComment,
	"KeyName": t.propertyName,
	"VariableName": t.variableName,
	"None": t.null,
	"function": t.function(t.name),
	", |": t.separator,
	"[ ]": t.squareBracket,
	"< >": t.angleBracket,
	"BraceOpen BraceClose": t.brace,
	"TypeBracketOpen TypeBracketClose": t.typeName,
	"Distance": t.literal,
	"Literal": t.literal,
	"RecordIdIdent": t.className,
	"Operator GraphLeft GraphRight GraphBoth": t.operator,
});
