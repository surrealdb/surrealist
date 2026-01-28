import { RecordId } from "surrealdb";
import { MigrationDiagnosticResult, MigrationResourceType } from "~/types";

/*
Available origin patterns:

["user", $user_name: string]
["access", $user_name: string]

["ns", $namespace : string, "user", $user_name: string]
["ns", $namespace : string, "access", $access_name: string]

["ns", $namespace : string, "db", $database : string, "user", $user_name: string]
["ns", $namespace : string, "db", $database : string, "api", $api_name: string]
["ns", $namespace : string, "db", $database : string, "access", $access_name: string]
["ns", $namespace : string, "db", $database : string, "param", $param_name: string]
["ns", $namespace : string, "db", $database : string, "function", $function_name: string]

["ns", $namespace : string, "db", $database : string, "table", $table_name : string, "event", $event_name : string]
["ns", $namespace : string, "db", $database : string, "table", $table_name : string, "index", $index_name : string]
["ns", $namespace : string, "db", $database : string, "table", $table_name : string, "record", $record_id: any] 
*/

export interface DiagnosticEntry {
	id: string;
	source: MigrationDiagnosticResult;
	record?: RecordId;
}

export interface DiagnosticResource {
	id: string;
	name: string;
	path: string;
	entries: DiagnosticEntry[];
}

export type ResourceMap = Record<MigrationResourceType, DiagnosticResource[]>;

export function organizeDiagnostics(diagnostics: MigrationDiagnosticResult[]): ResourceMap {
	const resources: ResourceMap = {
		"kv-user": [],
		"kv-access": [],
		"ns-user": [],
		"ns-access": [],
		"db-user": [],
		"db-api": [],
		"db-access": [],
		"db-param": [],
		"db-function": [],
		"db-tb-event": [],
		"db-tb-index": [],
		"db-tb-record": [],
	};

	for (const diagnostic of diagnostics) {
		const info = resolveResource(diagnostic.origin);

		if (!info) {
			continue;
		}

		// skip bugged duplicates
		if (diagnostic.origin[4] === "function" && diagnostic.origin[6] === "function") {
			continue;
		}

		const bucket = resources[info.type];
		const existing = bucket.find((resource) => resource.id === info.id);
		const entry = {
			id: diagnostic.origin.join("/"),
			source: diagnostic,
			record: info.record,
		};

		if (existing) {
			existing.entries.push(entry);
		} else {
			bucket.push({
				id: info.id,
				name: info.name,
				path: info.path,
				entries: [entry],
			});
		}
	}

	return resources;
}

interface ResourceInfo {
	type: MigrationResourceType;
	id: string;
	name: string;
	path: string;
	record?: RecordId;
}

function resolveResource(origin: MigrationDiagnosticResult["origin"]): ResourceInfo | null {
	if (!Array.isArray(origin) || origin.length === 0) {
		return null;
	}

	const serialize = (value: unknown) => {
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			return String(value);
		}

		if (value && typeof value === "object" && "id" in (value as Record<string, unknown>)) {
			const record = value as { tb?: string; id?: string };

			if (record.tb && record.id) {
				return `${record.tb}:${record.id}`;
			}
		}

		try {
			return JSON.stringify(value);
		} catch {
			return String(value);
		}
	};

	const key = origin.map(serialize);
	const id = key.join("/");

	const segments = key.filter((_, index) => index % 2 === 1);
	const name = segments.at(-1) ?? "";
	const path = segments.slice(0, -1).join("/");

	if (origin[0] === "user" && origin.length >= 2) {
		return { type: "kv-user", id, name, path };
	}

	if (origin[0] === "access" && origin.length >= 2) {
		return { type: "kv-access", id, name, path };
	}

	if (origin[0] === "ns" && origin.length >= 4) {
		if (origin[2] === "user") {
			return { type: "ns-user", id, name, path };
		}

		if (origin[2] === "access") {
			return { type: "ns-access", id, name, path };
		}

		if (origin[2] === "db" && origin.length >= 6) {
			const label = origin[4];

			if (label === "user") {
				return { type: "db-user", id, name, path };
			}

			if (label === "api") {
				return { type: "db-api", id, name, path };
			}

			if (label === "access") {
				return { type: "db-access", id, name, path };
			}

			if (label === "param") {
				return { type: "db-param", id, name: `$${name}`, path };
			}

			if (label === "function") {
				return { type: "db-function", id, name: `fn::${name}()`, path };
			}

			if (label === "table" && origin.length >= 8) {
				const tableLabel = origin[6];

				if (tableLabel === "event") {
					return { type: "db-tb-event", id, name, path };
				}

				if (tableLabel === "index") {
					return { type: "db-tb-index", id, name, path };
				}

				if (tableLabel === "record") {
					return {
						type: "db-tb-record",
						id: key.slice(0, 6).join("/"),
						name: key[5],
						path: segments.slice(0, -2).join("/"),
						record: new RecordId(origin[5], origin[7]),
					};
				}
			}
		}
	}

	return null;
}
