import { useStoreValue } from "~/store";

/**
 * Returns whether Surrealist is connected to a database
 */
export function useIsConnected() {
	return useStoreValue((state) => state.database.isConnected);
}
