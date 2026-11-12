import { afterEach, expect, test } from "bun:test";
import { HttpConnectionError } from "surrealdb";
import { importSqlFile } from "../src/util/import";

const NativeRequest = globalThis.Request;
const sql = "CREATE person:one SET name = 'Zoë';";

afterEach(() => {
	globalThis.Request = NativeRequest;
});

function requestSupport(mode: "stream" | "stringify" | "no-duplex") {
	globalThis.Request = class extends NativeRequest {
		constructor(input: RequestInfo | URL, init?: RequestInit & { duplex?: string }) {
			const body =
				mode === "stringify" && init?.body instanceof ReadableStream
					? String(init.body)
					: init?.body;
			const duplex = mode === "stream" ? init?.duplex : "half";
			super(input, { method: init?.method, body, duplex } as RequestInit);
		}
	};
}

function httpError(status: number) {
	return new HttpConnectionError("Import rejected", status, "error", new ArrayBuffer(0));
}

test("a browser that stringifies request streams imports the actual file once", async () => {
	requestSupport("stringify");
	const file = new File([sql], "backup.surql");
	const sent: (File | ReadableStream<Uint8Array>)[] = [];

	await importSqlFile(file, async (body) => {
		sent.push(body);
		const request = new Request("https://db.test/import", { method: "POST", body });
		if ((await request.text()) !== sql) {
			throw httpError(400);
		}
	});

	expect(sent).toEqual([file]);
});

test("a browser without request duplex support sends a file before fetching", async () => {
	requestSupport("no-duplex");
	const file = new File([sql], "backup.surql");
	const sent: (File | ReadableStream<Uint8Array>)[] = [];

	await importSqlFile(file, async (body) => {
		sent.push(body);
		if (body instanceof ReadableStream) {
			throw new TypeError("ReadableStream uploading is not supported");
		}
		expect(await body.text()).toBe(sql);
	});

	expect(sent).toEqual([file]);
});

test("supported browsers retain streaming and the complete UTF-8 contents", async () => {
	requestSupport("stream");
	const file = new File([sql], "backup.surql");
	let calls = 0;

	await importSqlFile(file, async (body) => {
		calls++;
		expect(body).toBeInstanceOf(ReadableStream);
		const request = new NativeRequest("https://db.test/import", {
			method: "POST",
			body,
		});
		expect(await request.text()).toBe(sql);
	});

	expect(calls).toBe(1);
});

test("statement errors are propagated without retrying the import", async () => {
	requestSupport("stream");
	const error = httpError(400);
	let calls = 0;

	await expect(
		importSqlFile(new File([sql], "backup.surql"), async () => {
			calls++;
			throw error;
		}),
	).rejects.toBe(error);

	expect(calls).toBe(1);
});

test("existing transport-error fallback retries the stream as a file", async () => {
	requestSupport("stream");
	const file = new File([sql], "backup.surql");
	const sent: (File | ReadableStream<Uint8Array>)[] = [];

	await importSqlFile(file, async (body) => {
		sent.push(body);
		if (body instanceof ReadableStream) {
			throw httpError(502);
		}
	});

	expect(sent).toHaveLength(2);
	expect(sent[1]).toBe(file);
});

test("an import that starts with a file is never retried", async () => {
	requestSupport("stringify");
	let calls = 0;
	const error = httpError(502);

	await expect(
		importSqlFile(new File([sql], "backup.surql"), async () => {
			calls++;
			throw error;
		}),
	).rejects.toBe(error);

	expect(calls).toBe(1);
});

test("a failed capability probe conservatively imports the file", async () => {
	globalThis.Request = class extends NativeRequest {
		constructor() {
			super("https://db.test/");
			throw new TypeError("Request streaming is unavailable");
		}
	};
	const file = new File([sql], "backup.surql");
	const sent: (File | ReadableStream<Uint8Array>)[] = [];

	await importSqlFile(file, async (body) => {
		sent.push(body);
	});

	expect(sent).toEqual([file]);
});
