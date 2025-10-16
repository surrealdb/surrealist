import { Value, SurrealQL as Wasm } from "@surrealdb/ql-wasm";
import { CborCodec } from "surrealdb";
import { SurrealQL } from "./surrealql";

export class SurrealQLV2 implements SurrealQL {
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
			Wasm.validate_where(where);
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
	getLiveQueries(query: string): Promise<number[]> {
		const tree: any[] = Wasm.parse(query);

		const result = tree.reduce((acc: number[], stmt, idx) => {
			if (stmt.Live) {
				acc.push(idx);
			}

			return acc;
		}, []);

		return Promise.resolve(result);
	}

	formatQuery(query: string, pretty = true): Promise<string> {
		return Promise.resolve(Wasm.format(query, pretty));
	}

	extractKindRecords(kind: string): Promise<string[]> {
		try {
			const ast = Wasm.parse(`DEFINE FIELD dummy ON dummy TYPE ${kind}`);
			const root = ast[0].Define.Field.kind;
			const records = new Set<string>();

			this.#parseKindTree(root, records);

			return Promise.resolve([...records.values()]);
		} catch (err: any) {
			console.error(err);
			return Promise.resolve([]);
		}
	}

	#parseKindTree(obj: any, records: Set<string>) {
		if (!obj) return;

		if (obj.Record) {
			for (const record of obj.Record) {
				records.add(record);
			}
		} else if (obj.Option.Record) {
			for (const record of obj.Option.Record) {
				records.add(record);
			}
		} else if (obj.Array) {
			this.#parseKindTree(obj.Array[0], records);
		} else if (obj.Set) {
			this.#parseKindTree(obj.Array[0], records);
		} else if (obj.Either) {
			for (const either of obj.Either) {
				this.#parseKindTree(either, records);
			}
		}
	}
}
