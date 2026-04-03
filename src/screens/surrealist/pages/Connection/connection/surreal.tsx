import { createWasmWorkerEngines } from "@surrealdb/wasm";
import WasmWorker from "@surrealdb/wasm/worker?worker";
import { applyDiagnostics, createRemoteEngines, Surreal } from "surrealdb";
import { useDatabaseStore } from "~/stores/database";
import { getSetting } from "~/util/config";

/**
 * Create a new configured Surreal instance
 */
export async function createSurreal() {
	const { pushDiagnostic } = useDatabaseStore.getState();
	const maxSize = getSetting("behavior", "diagnosticsHistorySize");

	const engines = {
		...createRemoteEngines(),
		...createWasmWorkerEngines({
			createWorker: () => new WasmWorker({ name: "surrealist-wasm" }),
			capabilities: {
				experimental: true,
				functions: true,
				guest_access: true,
				live_query_notifications: true,
				network_targets: true,
			},
		}),
	};

	return new Surreal({
		engines: applyDiagnostics(engines, (diagnostic) => {
			if (getSetting("behavior", "recordDiagnostics")) {
				pushDiagnostic(diagnostic, maxSize);
			}
		}),
	});
}
