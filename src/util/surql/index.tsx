import { satisfies } from "compare-versions";
import { SurrealQL } from "./surrealql";
import { SurrealQLV2 } from "./v2";
import { SurrealQLV3 } from "./v3";

export function createSurrealQL(version: string): SurrealQL {
	return satisfies(version, ">= 3.0.0-alpha.1") ? new SurrealQLV3() : new SurrealQLV2();
}
