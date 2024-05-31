import { fileTests } from "@lezer/generator/dist/test";
import { parser } from "../dist/index.js";

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
let caseDir = path.dirname(fileURLToPath(import.meta.url));

let filter = process.argv[2];

for (let file of fs.readdirSync(caseDir)) {
	if (!/\.txt$/.test(file)) continue;
	console.log("File " + file + ":");
	for (let { name, run } of fileTests(
		fs.readFileSync(path.join(caseDir, file), "utf8"),
		file,
	)) {
		if (!filter || name.indexOf(filter) > -1) {
			try {
				run(parser);
				console.log(" ✔ " + name);
			} catch (e) {
				console.log(
					" ✘ " +
						name +
						"\n   " +
						String(e.message || e).replace(/\n/g, "\n   "),
				);
			}
		}
	}
}
