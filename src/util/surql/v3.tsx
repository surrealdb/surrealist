import { Value, SurrealQL as Wasm } from "@surrealdb/ql-wasm-3";
import { CborCodec } from "surrealdb";
import { adapter } from "~/adapter";
import { QueryResponse } from "~/types";
import { SurrealQL } from "./surrealql";

export class SurrealQLV3 implements SurrealQL {
	constructor() {
		adapter.log("SurrealQL", "Initializing SurrealQL V3");
		(window as any).SurrealQL = this;
	}

	validateQuery(sql: string): Promise<string | undefined> {
		try {
			Wasm.validate(sql);
			return Promise.resolve(undefined);
		} catch (err: any) {
			return Promise.resolve(err);
		}
	}

	validateWhere(where: string): Promise<string | undefined> {
		try {
			(window as any).Wasm = Wasm;
			Wasm.validate(`SELECT * FROM ${where}`);
			return Promise.resolve(undefined);
		} catch (err: any) {
			return Promise.resolve(err);
		}
	}

	formatValue(value: any, json = false, pretty = false): Promise<string> {
		const codec = new CborCodec({});
		const binary = new Uint8Array(codec.encode(value));
		const parsed = Value.from_cbor(binary);

		return Promise.resolve(parsed[json ? "json" : "format"](pretty));
	}

	parseValue<T = unknown>(value: string): Promise<T> {
		const codec = new CborCodec({});
		const cborBuffer = Value.from_string(value).to_cbor().buffer;
		const cborUint8 = new Uint8Array(cborBuffer);

		return Promise.resolve(codec.decode<T>(cborUint8));
	}

	getLiveQueries(_query: string, responses: QueryResponse[]): Promise<number[]> {
		const indexes: number[] = [];

		for (const [idx, response] of responses.entries()) {
			if (response.success && response.type === "live") {
				indexes.push(idx);
			}
		}

		return Promise.resolve(indexes);
	}

	formatQuery(query: string, pretty = true): Promise<string> {
		return Promise.resolve(Wasm.format(query, pretty));
	}

	extractKindRecords(kind: string): Promise<string[]> {
		try {
			return Promise.resolve(Wasm.extract_tables_from_kind(kind));
		} catch (err: any) {
			console.error(err);
			return Promise.resolve([]);
		}
	}
}
