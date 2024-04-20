import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { URL } from "node:url";

const __dirname = new URL('.', import.meta.url).pathname;

export function generateGrammarHash() {
	return [
		fs.readFileSync(path.join(__dirname, '../src/highlight.js')),
		fs.readFileSync(path.join(__dirname, '../src/parser.js')),
		fs.readFileSync(path.join(__dirname, '../src/parser.terms.js')),
		fs.readFileSync(path.join(__dirname, '../src/surrealql.grammar')),
		fs.readFileSync(path.join(__dirname, '../src/tokens.js')),
	]
		.map((content) => crypto.createHash('md5').update(content, 'utf8').digest('hex').slice(0, 50))
		.join('');
}
