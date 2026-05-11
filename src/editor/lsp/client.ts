/**
 * Typed wrapper around the language-server Web Worker.
 *
 * `SurqlLspClient` exposes a small Promise-based RPC surface plus an
 * event emitter for server-pushed notifications. Consumers (the
 * CodeMirror extension, the metadata pump) talk to *this* class — they
 * never touch the worker postMessage protocol directly.
 */

import type { WorkerInbound, WorkerOutbound } from "./protocol";

type ConfigurationProvider = () => unknown | Promise<unknown>;

type DiagnosticsListener = (uri: string, diagnostics: unknown) => void;

type LogListener = (level: number, message: string) => void;

interface PendingRpc {
	resolve: (value: string | null) => void;
	reject: (error: Error) => void;
}

let nextRequestId = 1;
const newRequestId = () => nextRequestId++;

export interface SurqlLspClientOptions {
	/**
	 * Called when the server asks the client for the current
	 * `surrealql` configuration via `workspace/configuration`. Return
	 * the JSON-serialisable settings object (or `null`).
	 */
	provideConfiguration: ConfigurationProvider;
}

export class SurqlLspClient {
	private readonly worker: Worker;
	private readonly pending = new Map<number, PendingRpc>();
	private readonly diagnosticsListeners = new Set<DiagnosticsListener>();
	private readonly logListeners = new Set<LogListener>();
	private readonly readyPromise: Promise<void>;
	private readyResolver!: () => void;

	constructor(private readonly options: SurqlLspClientOptions) {
		this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
			type: "module",
			name: "surrealql-language-server",
		});
		this.readyPromise = new Promise<void>((resolve) => {
			this.readyResolver = resolve;
		});
		this.worker.addEventListener("message", this.handleMessage);
	}

	/** Resolves when the worker has finished loading the wasm module. */
	ready(): Promise<void> {
		return this.readyPromise;
	}

	/** Subscribe to `textDocument/publishDiagnostics` notifications. */
	onDiagnostics(listener: DiagnosticsListener): () => void {
		this.diagnosticsListeners.add(listener);
		return () => this.diagnosticsListeners.delete(listener);
	}

	/** Subscribe to `window/logMessage` notifications. */
	onLog(listener: LogListener): () => void {
		this.logListeners.add(listener);
		return () => this.logListeners.delete(listener);
	}

	/**
	 * Send an LSP request and await the typed `result` field of the
	 * JSON-RPC response. Throws on transport failure or LSP error.
	 */
	async sendRequest<T = unknown>(method: string, params?: unknown): Promise<T> {
		const id = newRequestId();
		const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params });
		const response = await this.dispatchRpc(payload);
		if (response === null) {
			throw new Error(`LSP method '${method}' returned no response`);
		}
		const parsed = JSON.parse(response) as
			| { result: T }
			| { error: { code: number; message: string } };
		if ("error" in parsed) {
			throw new Error(`LSP error (${parsed.error.code}): ${parsed.error.message}`);
		}
		return parsed.result;
	}

	/** Send an LSP notification (fire-and-forget). */
	async sendNotification(method: string, params?: unknown): Promise<void> {
		const payload = JSON.stringify({ jsonrpc: "2.0", method, params });
		await this.dispatchRpc(payload);
	}

	/**
	 * Push a `.surql` document the host considers part of the saved
	 * workspace (typically a file in the project the user just hasn't
	 * opened in an editor yet).
	 */
	pushWorkspaceDocument(uri: string, text: string): void {
		this.send({ kind: "pushWorkspaceDocument", uri, text });
	}

	dropWorkspaceDocument(uri: string): void {
		this.send({ kind: "dropWorkspaceDocument", uri });
	}

	replaceWorkspace(documents: Array<{ uri: string; text: string }>): void {
		this.send({ kind: "replaceWorkspace", documents });
	}

	/**
	 * Replace the live SurrealDB metadata snapshot. `defineStrings`
	 * is the list of `DEFINE …` SurrealQL statements harvested from
	 * `INFO FOR DB` / `INFO FOR TABLE` against the active connection.
	 */
	setLiveMetadata(defineStrings: string[]): void {
		this.send({ kind: "setLiveMetadata", defineStrings });
	}

	/** Tear down the worker. Idempotent. */
	dispose(): void {
		this.worker.removeEventListener("message", this.handleMessage);
		this.worker.terminate();
		for (const pending of this.pending.values()) {
			pending.reject(new Error("language server worker terminated"));
		}
		this.pending.clear();
	}

	private async dispatchRpc(payload: string): Promise<string | null> {
		await this.readyPromise;
		const id = newRequestId();
		return new Promise<string | null>((resolve, reject) => {
			this.pending.set(id, { resolve, reject });
			this.send({ kind: "rpc", id, payload });
		});
	}

	private send(message: WorkerInbound): void {
		this.worker.postMessage(message);
	}

	private handleMessage = async (event: MessageEvent<WorkerOutbound>) => {
		const message = event.data;
		switch (message.kind) {
			case "ready": {
				this.readyResolver();
				return;
			}
			case "rpcResult": {
				const pending = this.pending.get(message.id);
				if (pending) {
					this.pending.delete(message.id);
					pending.resolve(message.payload);
				}
				return;
			}
			case "rpcError": {
				const pending = this.pending.get(message.id);
				if (pending) {
					this.pending.delete(message.id);
					pending.reject(new Error(message.message));
				}
				return;
			}
			case "publishDiagnostics": {
				for (const listener of this.diagnosticsListeners) {
					listener(message.uri, message.diagnostics);
				}
				return;
			}
			case "logMessage": {
				for (const listener of this.logListeners) {
					listener(message.level, message.message);
				}
				return;
			}
			case "requestConfiguration": {
				let value: unknown = null;
				try {
					value = await this.options.provideConfiguration();
				} catch (error) {
					console.error(
						"surrealql language server: failed to resolve configuration",
						error,
					);
				}
				this.send({ kind: "configuration", id: message.id, value });
				return;
			}
		}
	};
}
