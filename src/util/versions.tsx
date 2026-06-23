import { satisfies } from "compare-versions";

/**
 * The first supported version of SurrealDB 2.0
 */
export const SDB_2_0_0 = "2.0.0-beta.1";

/**
 * The first supported version of SurrealDB 3.0
 */
export const SDB_3_0_0 = "3.0.0-alpha.1";

/**
 * The first supported version of SurrealDB 3.1
 */
export const SDB_3_1_0 = "3.1.0";

export function isSurrealDBv3(version: string): boolean {
	try {
		return satisfies(version, `>= ${SDB_3_0_0}`);
	} catch {
		return false;
	}
}

export function filterSurrealDB3Versions(versions: string[]): string[] {
	return versions.filter(isSurrealDBv3);
}
