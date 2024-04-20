/* global console */

import fs from "node:fs";
import path from 'node:path';
import { URL } from "node:url";
import { generateGrammarHash } from "./hash.mjs";
import { spawn } from "node:child_process";

const __dirname = new URL('.', import.meta.url).pathname;
const checksumFile = path.join(__dirname, "../dist/checksum");

const hash = generateGrammarHash();
let currentHash = '';
try { currentHash = fs.readFileSync(checksumFile).toString(); } catch(err) { err; }

if (hash != currentHash) {
	fs.writeFileSync(checksumFile, hash);
	const child = spawn(`pnpm`, ['compile'], {
		cwd: path.dirname(__dirname),
	});

	child.stdout.setEncoding('utf8');
	child.stderr.setEncoding('utf8');
	child.stdout.on('data', console.log);
	child.stderr.on('data', console.log);
}
