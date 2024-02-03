import { useDatabaseStore } from "~/stores/database";

/**
 * Returns whether Surrealist is connected to a database
 */
export function useIsConnected() {
	return useDatabaseStore((s) => s.isConnected);
}
