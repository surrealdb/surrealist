/**
 * Typed wrapper around the language-server Web Worker.
 *
 * `SurqlLspClient` exposes a small Promise-based RPC surface plus an
 * event emitter for server-pushed notifications. Consumers (the
 * CodeMirror extension, the metadata pump) talk to *this* class — they
 * never touch the worker postMessage protocol directly.
 *
 * On top of the wire-level surface the client also tracks a coarse
 * lifecycle state (`loading | ready | failed`), records per-method
 * latency samples, and exposes an `onError` event so the host UI can
 * show a "language server crashed" banner with a manual restart
 * affordance.
 */

import type { WorkerInbound, WorkerOutbound } from "./protocol";

type ConfigurationProvider = () => unknown | Promise<unknown>;

type DiagnosticsListener = (uri: string, diagnostics: unknown) => void;

type LogListener = (level: number, message: string) => void;

type StateListener = (state: SurqlLspState) => void;

type ErrorListener = (error: SurqlLspError) => void;

type RestartListener = () => void;

interface PendingRpc {
	method: string;
	startedAt: number;
	resolve: (value: string | null) => void;
	reject: (error: Error) => void;
	cleanup: () => void;
}

let nextRequestId = 1;
const newRequestId = () => nextRequestId++;

/** Coarse client lifecycle state, consumed by the status indicator. */
export type SurqlLspState = "loading" | "ready" | "failed";

/** Default request timeout for editor RPCs (hover, completion, ...). */
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

/** Maximum number of latency samples kept per method for metrics. */
const METRICS_RETENTION = 100;

/** Thrown when an RPC exceeds its deadline. */
export class LspTimeoutError extends Error {
	constructor(method: string, timeoutMs: number) {
		super(`LSP request '${method}' timed out after ${timeoutMs}ms`);
		this.name = "LspTimeoutError";
	}
}

/** Thrown when the worker emits an uncaught error / messageerror. */
export class LspWorkerError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "LspWorkerError";
	}
}

export interface SurqlLspError {
	kind: "init" | "worker" | "messageerror";
	message: string;
	at: number;
}

export interface SurqlLspMethodMetric {
	count: number;
	p50: number;
	p95: number;
	max: number;
}

export interface SurqlLspMetrics {
	totalRequests: number;
	failedRequests: number;
	perMethod: Record<string, SurqlLspMethodMetric>;
}

export interface SurqlLspTelemetry {
	state: SurqlLspState;
	startedAt: number;
	readyAt: number | null;
	initializedAt: number | null;
	lastError: SurqlLspError | null;
	restartCount: number;
}

export interface SendRequestOptions {
	signal?: AbortSignal;
	/**
	 * Per-request timeout in milliseconds. Pass `0` to disable. When
	 * omitted defaults to {@link DEFAULT_REQUEST_TIMEOUT_MS}, except for
	 * `initialize` which is always allowed to run without a deadline.
	 */
	timeout?: number;
}

export interface SurqlLspClientOptions {
	/**
	 * Called when the server asks the client for the current
	 * `surrealql` configuration via `workspace/configuration`. Return
	 * the JSON-serialisable settings object (or `null`).
	 */
	provideConfiguration: ConfigurationProvider;
}

export class SurqlLspClient {
	private worker!: Worker;
	private readonly pending = new Map<number, PendingRpc>();
	private readonly diagnosticsListeners = new Set<DiagnosticsListener>();
	private readonly logListeners = new Set<LogListener>();
	private readonly stateListeners = new Set<StateListener>();
	private readonly errorListeners = new Set<ErrorListener>();
	private readonly restartListeners = new Set<RestartListener>();
	private readyPromise!: Promise<void>;
	private readyResolver!: () => void;
	private readyRejecter!: (error: Error) => void;
	private initializedPromise: Promise<void> | null = null;
	private state: SurqlLspState = "loading";
	private telemetry: SurqlLspTelemetry = {
		state: "loading",
		startedAt: Date.now(),
		readyAt: null,
		initializedAt: null,
		lastError: null,
		restartCount: 0,
	};
	private readonly latencyByMethod = new Map<string, number[]>();
	private totalRequests = 0;
	private failedRequests = 0;
	private disposed = false;

	constructor(private readonly options: SurqlLspClientOptions) {
		this.buildWorker();
	}

	/** Resolves when the worker has finished loading the wasm module. */
	ready(): Promise<void> {
		return this.readyPromise;
	}

	/**
	 * Resolves once the LSP `initialize`/`initialized` handshake has
	 * completed. Document sync and editor features should await this
	 * before sending `textDocument/*` notifications.
	 */
	ensureInitialized(): Promise<void> {
		return this.initializedPromise ?? this.readyPromise;
	}

	/**
	 * Kick off (or return) the one-time LSP lifecycle handshake.
	 * Safe to call multiple times — only the first call runs.
	 */
	startInitialization(initializationOptions: unknown): Promise<void> {
		if (!this.initializedPromise) {
			this.initializedPromise = this.ready()
				.then(() =>
					this.sendRequest(
						"initialize",
						{
							processId: null,
							capabilities: {},
							initializationOptions: { surrealql: initializationOptions },
						},
						{ timeout: 0 },
					),
				)
				.then(() => this.sendNotification("initialized", {}))
				.then(() => {
					this.telemetry.initializedAt = Date.now();
					this.setState("ready");
				})
				.catch((error: Error) => {
					this.initializedPromise = null;
					this.recordError({
						kind: "init",
						message: error.message,
						at: Date.now(),
					});
					this.setState("failed");
					throw error;
				});
		}
		return this.initializedPromise;
	}

	/**
	 * Tear down the existing worker and start a fresh one with a new
	 * `initialize` handshake. Any in-flight RPCs are rejected with a
	 * worker-error before the new worker starts.
	 *
	 * Pumps that need to re-push their state on restart can subscribe
	 * via {@link onRestart}; the listeners fire after the new worker
	 * has finished `initialize`/`initialized`.
	 */
	async restart(initializationOptions: unknown): Promise<void> {
		if (this.disposed) {
			throw new Error("language server client has been disposed");
		}

		this.tearDownWorker(new LspWorkerError("language server restarting"));
		this.telemetry.restartCount += 1;
		this.telemetry.readyAt = null;
		this.telemetry.initializedAt = null;
		this.setState("loading");
		this.buildWorker();
		await this.startInitialization(initializationOptions);
		for (const listener of this.restartListeners) {
			try {
				listener();
			} catch (error) {
				console.error("surrealql language server: restart listener failed", error);
			}
		}
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
	 * Subscribe to lifecycle state changes (`loading` → `ready` →
	 * `failed`). Fires synchronously with the current state on attach.
	 */
	onStateChange(listener: StateListener): () => void {
		this.stateListeners.add(listener);
		listener(this.state);
		return () => this.stateListeners.delete(listener);
	}

	/**
	 * Subscribe to client-level errors (init failure, worker crash,
	 * deserialisation error). The `LspStatus` indicator uses this to
	 * show a recoverable error state with a manual restart button.
	 */
	onError(listener: ErrorListener): () => void {
		this.errorListeners.add(listener);
		return () => this.errorListeners.delete(listener);
	}

	/**
	 * Subscribe to restart completions. Pumps that maintain pushed
	 * state (workspace snapshot, live metadata) re-flush from this
	 * callback so the new worker starts with the same view of the
	 * world the previous one had.
	 */
	onRestart(listener: RestartListener): () => void {
		this.restartListeners.add(listener);
		return () => this.restartListeners.delete(listener);
	}

	/** Coarse client state, useful for synchronous reads in renders. */
	getState(): SurqlLspState {
		return this.state;
	}

	/** Snapshot of the current telemetry. */
	getTelemetry(): SurqlLspTelemetry {
		return { ...this.telemetry };
	}

	/**
	 * Snapshot of latency metrics per method. Latency samples are
	 * kept in a bounded sliding window per method
	 * ({@link METRICS_RETENTION}).
	 */
	getMetrics(): SurqlLspMetrics {
		const perMethod: Record<string, SurqlLspMethodMetric> = {};
		for (const [method, samples] of this.latencyByMethod) {
			if (samples.length === 0) continue;
			const sorted = [...samples].sort((a, b) => a - b);
			const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
			const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
			const max = sorted[sorted.length - 1] ?? 0;
			perMethod[method] = { count: samples.length, p50, p95, max };
		}
		return {
			totalRequests: this.totalRequests,
			failedRequests: this.failedRequests,
			perMethod,
		};
	}

	/**
	 * Send an LSP request and await the typed `result` field of the
	 * JSON-RPC response. Throws on transport failure or LSP error.
	 */
	async sendRequest<T = unknown>(
		method: string,
		params?: unknown,
		options?: SendRequestOptions,
	): Promise<T> {
		if (method !== "initialize") {
			await this.ensureInitialized();
		}
		const id = newRequestId();
		const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params });
		const response = await this.dispatchRpc(method, payload, options);
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

	/** Send an LSP notification (waits for the worker to acknowledge). */
	async sendNotification(
		method: string,
		params?: unknown,
		options?: SendRequestOptions,
	): Promise<void> {
		if (method !== "initialized") {
			await this.ensureInitialized();
		}
		const payload = JSON.stringify({ jsonrpc: "2.0", method, params });
		await this.dispatchRpc(method, payload, options);
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
		if (this.disposed) return;
		this.disposed = true;
		this.tearDownWorker(new Error("language server worker terminated"));
	}

	private buildWorker(): void {
		this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
			type: "module",
			name: "surrealql-language-server",
		});
		this.readyPromise = new Promise<void>((resolve, reject) => {
			this.readyResolver = resolve;
			this.readyRejecter = reject;
		});
		this.telemetry.startedAt = Date.now();
		this.worker.addEventListener("message", this.handleMessage);
		this.worker.addEventListener("error", this.handleWorkerError);
		this.worker.addEventListener("messageerror", this.handleMessageError);
	}

	private tearDownWorker(reason: Error): void {
		this.worker.removeEventListener("message", this.handleMessage);
		this.worker.removeEventListener("error", this.handleWorkerError);
		this.worker.removeEventListener("messageerror", this.handleMessageError);
		this.worker.terminate();
		this.initializedPromise = null;
		for (const pending of [...this.pending.values()]) {
			try {
				pending.cleanup();
			} catch {
				/* swallow — we're tearing down */
			}
			pending.reject(reason);
		}
		this.pending.clear();
	}

	private setState(next: SurqlLspState): void {
		if (this.state === next) return;
		this.state = next;
		this.telemetry.state = next;
		for (const listener of this.stateListeners) {
			try {
				listener(next);
			} catch (error) {
				console.error("surrealql language server: state listener failed", error);
			}
		}
	}

	private recordError(error: SurqlLspError): void {
		this.telemetry.lastError = error;
		for (const listener of this.errorListeners) {
			try {
				listener(error);
			} catch (listenerError) {
				console.error("surrealql language server: error listener failed", listenerError);
			}
		}
	}

	private recordLatency(method: string, durationMs: number): void {
		let samples = this.latencyByMethod.get(method);
		if (!samples) {
			samples = [];
			this.latencyByMethod.set(method, samples);
		}
		samples.push(durationMs);
		if (samples.length > METRICS_RETENTION) {
			samples.splice(0, samples.length - METRICS_RETENTION);
		}
	}

	private dispatchRpc(
		method: string,
		payload: string,
		options?: SendRequestOptions,
	): Promise<string | null> {
		return this.readyPromise.then(
			() =>
				new Promise<string | null>((resolve, reject) => {
					if (this.disposed) {
						reject(new Error("language server worker terminated"));
						return;
					}
					if (options?.signal?.aborted) {
						reject(this.makeAbortError());
						return;
					}

					const id = newRequestId();
					const startedAt = performance.now();
					const timeoutMs =
						method === "initialize"
							? 0
							: (options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MS);

					let timer: ReturnType<typeof setTimeout> | null = null;
					let abortHandler: (() => void) | null = null;

					const cleanup = () => {
						if (timer !== null) {
							clearTimeout(timer);
							timer = null;
						}
						if (abortHandler && options?.signal) {
							options.signal.removeEventListener("abort", abortHandler);
							abortHandler = null;
						}
					};

					const wrappedResolve = (value: string | null) => {
						this.totalRequests += 1;
						this.recordLatency(method, performance.now() - startedAt);
						resolve(value);
					};
					const wrappedReject = (error: Error) => {
						this.totalRequests += 1;
						this.failedRequests += 1;
						this.recordLatency(method, performance.now() - startedAt);
						reject(error);
					};

					this.pending.set(id, {
						method,
						startedAt,
						resolve: wrappedResolve,
						reject: wrappedReject,
						cleanup,
					});

					if (timeoutMs > 0) {
						timer = setTimeout(() => {
							const pending = this.pending.get(id);
							if (!pending) return;
							this.pending.delete(id);
							pending.cleanup();
							pending.reject(new LspTimeoutError(method, timeoutMs));
						}, timeoutMs);
					}

					if (options?.signal) {
						abortHandler = () => {
							const pending = this.pending.get(id);
							if (!pending) return;
							this.pending.delete(id);
							pending.cleanup();
							pending.reject(this.makeAbortError());
						};
						options.signal.addEventListener("abort", abortHandler, { once: true });
					}

					this.send({ kind: "rpc", id, payload });
				}),
		);
	}

	private send(message: WorkerInbound): void {
		this.worker.postMessage(message);
	}

	private makeAbortError(): Error {
		if (typeof DOMException === "function") {
			return new DOMException("language server request aborted", "AbortError");
		}
		const error = new Error("language server request aborted");
		error.name = "AbortError";
		return error;
	}

	private handleMessage = async (event: MessageEvent<WorkerOutbound>) => {
		const message = event.data;
		switch (message.kind) {
			case "ready": {
				this.telemetry.readyAt = Date.now();
				this.readyResolver();
				return;
			}
			case "initError": {
				this.recordError({
					kind: "init",
					message: message.message,
					at: Date.now(),
				});
				this.setState("failed");
				this.readyRejecter(new Error(message.message));
				return;
			}
			case "rpcResult": {
				const pending = this.pending.get(message.id);
				if (pending) {
					this.pending.delete(message.id);
					pending.cleanup();
					pending.resolve(message.payload);
				}
				return;
			}
			case "rpcError": {
				const pending = this.pending.get(message.id);
				if (pending) {
					this.pending.delete(message.id);
					pending.cleanup();
					pending.reject(new Error(message.message));
				}
				return;
			}
			case "publishDiagnostics": {
				for (const listener of this.diagnosticsListeners) {
					try {
						listener(message.uri, message.diagnostics);
					} catch (error) {
						console.error(
							"surrealql language server: diagnostics listener failed",
							error,
						);
					}
				}
				return;
			}
			case "logMessage": {
				if (message.level === 1) {
					this.recordError({
						kind: "worker",
						message: message.message,
						at: Date.now(),
					});
				}
				for (const listener of this.logListeners) {
					try {
						listener(message.level, message.message);
					} catch (error) {
						console.error("surrealql language server: log listener failed", error);
					}
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

	private handleWorkerError = (event: ErrorEvent) => {
		const message = event.message || "language server worker crashed";
		this.recordError({
			kind: "worker",
			message,
			at: Date.now(),
		});
		this.setState("failed");
		const error = new LspWorkerError(message);
		// Reject any in-flight RPCs so callers don't hang.
		for (const pending of [...this.pending.values()]) {
			pending.cleanup();
			pending.reject(error);
		}
		this.pending.clear();
		// Also short-circuit the ready handshake if it hadn't resolved.
		try {
			this.readyRejecter(error);
		} catch {
			/* already settled */
		}
	};

	private handleMessageError = (event: MessageEvent) => {
		const message =
			event.data instanceof Error
				? event.data.message
				: "language server worker emitted an unparseable message";
		this.recordError({
			kind: "messageerror",
			message,
			at: Date.now(),
		});
	};
}
