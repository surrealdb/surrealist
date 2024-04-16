import { styleTags, tags as t } from "@lezer/highlight"

export const surqlHighlighting = styleTags({
	"Ident": t.name,
	"Keyword": t.keyword,
	"String": t.string,
	"Number": t.number,
	"Bool": t.bool,
	"Comment": t.lineComment,
	"ObjectKey": t.propertyName,
	"VariableName": t.variableName,
	"Null None": t.null,
	"function": t.function(t.name),
	", |": t.separator,
	"[ ]": t.squareBracket,
	"< >": t.angleBracket,
	"{ }": t.brace,
	"TypeBracketOpen TypeBracketClose": t.typeName,
	"Literal": t.literal,
	"RecordIdIdent": t.className,
	"Operator": t.operator,
});
