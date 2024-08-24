import {ExternalTokenizer} from "@lezer/lr";

import {
	_break,
	_continue,
	_default,
	_delete,
	_else,
	_for,
	_if,
	_in,
	_let,
	_return,
	_throw,
	_with,
	alter,
	analyzer,
	any,
	as,
	asc,
	assert,
	at,
	begin,
	bm25,
	by,
	cancel,
	capacity,
	changefeed,
	changes,
	columns,
	comment,
	commit,
	content,
	create,
	database,
	db,
	define,
	desc,
	dimension,
	dist,
	doc_ids_cache,
	doc_ids_order,
	doc_lengths_cache,
	doc_lengths_order,
	drop,
	duplicate,
	efc,
	end,
	event,
	exists,
	explain,
	extend_candidates,
	fetch,
	field,
	fields,
	filters,
	flexible,
	from,
	group,
	highlights,
	hnsw,
	ignore,
	index,
	info,
	insert,
	into,
	keep_pruned_connections,
	key,
	kill,
	limit,
	live,
	lm,
	m,
	m0,
	merge,
	mtree_cache,
	mtree,
	namespace,
	noindex,
	normal,
	not,
	ns,
	on,
	only,
	option,
	order,
	out,
	overwrite,
	parallel,
	param,
	passhash,
	password,
	patch,
	permissions,
	postings_cache,
	postings_order,
	readonly,
	rebuild,
	relate,
	relation,
	remove,
	roles,
	root,
	sc,
	schemafull,
	schemaless,
	scope,
	search,
	select,
	session,
	set,
	show,
	signin,
	signup,
	since,
	sleep,
	split,
	start,
	structure,
	table,
	tb,
	tempfiles,
	terms_cache,
	terms_order,
	then,
	timeout,
	to,
	token,
	tokenizers,
	transaction,
	typeKeyword,
	unique,
	unset,
	update,
	upsert,
	use,
	user,
	valueKeyword,
	values,
	when,
	where,

	// Literals
	_false,
	_null,
	_true,
	after,
	before,
	diff,
	full,
	none,

	f32,
	f64,
	i16,
	i32,
	i64,

	createPermissions,
	deletePermissions,
	selectPermissions,
	updatePermissions,

	jwks,
	eddsa,
	es256,
	es384,
	es512,
	ps256,
	ps384,
	ps512,
	rs256,
	rs384,
	rs512,

	allinside,
	and,
	anyinside,
	contains,
	containsall,
	containsany,
	containsnone,
	containsnot,
	inside,
	intersects,
	is,
	noneinside,
	notinside,
	opIn,
	opNot,
	or,
	outside,

	chebyshev,
	cosine,
	euclidean,
	hamming,
	jaccard,
	manhattan,
	minkowski,
	pearson,

	ascii,
	edgengram,
	ngram,
	snowball,
	uppercase,

	_class,
	blank,
	camel,
	punct,

	_function,
	rand,
	count,

	objectOpen,
} from "./parser.terms";

const tokenMap = {
	alter,
	analyzer,
	any,
	as,
	asc,
	assert,
	at,
	begin,
	bm25,
	break: _break,
	by,
	cancel,
	capacity,
	changefeed,
	changes,
	columns,
	comment,
	commit,
	content,
	continue: _continue,
	create,
	database,
	db,
	default: _default,
	define,
	delete: _delete,
	desc,
	dimension,
	dist,
	doc_ids_cache,
	doc_ids_order,
	doc_lengths_cache,
	doc_lengths_order,
	drop,
	duplicate,
	efc,
	else: _else,
	end,
	event,
	exists,
	explain,
	extend_candidates,
	fetch,
	field,
	fields,
	filters,
	flexible,
	for: _for,
	from,
	group,
	highlights,
	hnsw,
	if: _if,
	ignore,
	in: _in,
	index,
	info,
	insert,
	into,
	keep_pruned_connections,
	key,
	kill,
	let: _let,
	limit,
	live,
	lm,
	m,
	m0,
	merge,
	mtree_cache,
	mtree,
	namespace,
	noindex,
	normal,
	not,
	ns,
	on,
	only,
	option,
	order,
	out,
	overwrite,
	parallel,
	param,
	passhash,
	password,
	patch,
	permissions,
	postings_cache,
	postings_order,
	readonly,
	rebuild,
	relate,
	relation,
	remove,
	return: _return,
	roles,
	root,
	sc,
	schemafull,
	schemaless,
	scope,
	search,
	select,
	session,
	set,
	show,
	signin,
	signup,
	since,
	sleep,
	split,
	start,
	structure,
	table,
	tb,
	tempfiles,
	terms_cache,
	terms_order,
	then,
	throw: _throw,
	timeout,
	to,
	token,
	tokenizers,
	transaction,
	type: typeKeyword,
	unique,
	unset,
	update,
	upsert,
	use,
	user,
	value: valueKeyword,
	values,
	when,
	where,
	with: _with,

	// Literals
	after,
	before,
	diff,
	false: _false,
	full,
	none,
	null: _null,
	true: _true,

	f32,
	f64,
	i16,
	i32,
	i64,

	jwks,
	eddsa,
	es256,
	es384,
	es512,
	ps256,
	ps384,
	ps512,
	rs256,
	rs384,
	rs512,

	allinside,
	and,
	anyinside,
	contains,
	containsall,
	containsany,
	containsnone,
	containsnot,
	inside,
	intersects,
	is,
	noneinside,
	notinside,
	or,
	outside,

	chebyshev,
	cosine,
	euclidean,
	hamming,
	jaccard,
	manhattan,
	minkowski,
	pearson,

	ascii,
	edgengram,
	ngram,
	snowball,
	uppercase,

	blank,
	camel,
	class: _class,
	punct,

	// Function names
	function: _function,
	rand,
	count,
};

const tryMapped = new Map([
	["select", [selectPermissions]],
	["create", [createPermissions]],
	["update", [updatePermissions]],
	["delete", [deletePermissions]],
	["not", [opNot]],
	["in", [opIn]],
]);

export const tokens = function(t, stack) {
	for (const tk of tryMapped.get(t.toLowerCase()) ?? []) {
		if (stack.canShift(tk)) return tk;
	}

	return tokenMap[t.toLowerCase()] ?? -1;
}

function skipSpace(input, off) {
	for (;;) {
		let next = input.peek(off);
		if (next === 32 || next === 9 || next === 10 || next === 13) {
			off++;
		} else if (next === 35 /* '#' */ ||
				   (next === 47 /* '/' */ || next === 45 /* '-' */) && input.peek(off + 1) === next) {
			off++;
			for (;;) {
				let next = input.peek(off);
				if (next < 0 || next === 10 || next === 13) break;
				off++;
			}
		} else {
			return off;
		}
	}
}

function isIdentifierChar(ch) {
	return ch === 95 || ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch >= 48 && ch <= 57;
}

function skipObjKey(input, off) {
	let first = input.peek(off);
	if (isIdentifierChar(first)) {
		do {
			off++;
		} while (isIdentifierChar(input.peek(off)));
		return off;
	} else if (first === 38 /* "'" */ || first === 34 /* '"' */) {
		for (let escaped = false;;) {
			let next = input.peek(++off);
			if (next < 0) return off;
			if (next === first && !escaped) return off + 1;
			escaped = next === 92 /* '\\' */
		}
	}
}

export const objectToken = new ExternalTokenizer((input, _stack) => {
	if (input.next === 123 /* '{' */) {
		let off = skipSpace(input, 1);

		switch (input.peek(off)) {
			// Do we directly encounter another opening bracket?
			case 123: {
				// By not accepting the token, we indicate that the outer bracket is a block
				break;
			}

			// Is this an empty object?
			case 125: {
				input.acceptToken(objectOpen, 1);
				break;
			}

			default: {
				let key = skipObjKey(input, off);
				if (key !== null) {
					off = skipSpace(input, key);
					if (input.peek(off) === 58 /* ':' */) {
						input.acceptToken(objectOpen, 1);
					}
				}
			}
		}
	}
});
