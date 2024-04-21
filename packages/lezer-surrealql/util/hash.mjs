import fs from 'node:fs';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const base = new URL('..', import.meta.url);

export function generateGrammarHash() {
	return [
		fs.readFileSync(fileURLToPath(new URL('./src/highlight.js', base))),
		fs.readFileSync(fileURLToPath(new URL('./src/parser.js', base))),
		fs.readFileSync(fileURLToPath(new URL('./src/parser.terms.js', base))),
		fs.readFileSync(fileURLToPath(new URL('./src/surrealql.grammar', base))),
		fs.readFileSync(fileURLToPath(new URL('./src/tokens.js', base))),
	]
		.map((content) => crypto.createHash('md5').update(content, 'utf8').digest('hex').slice(0, 50))
		.join('');
}
