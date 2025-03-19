import { useConfigStore } from "~/stores/config";

export function clearCachedConnections() {
	const { connections } = useConfigStore.getState();

	const pruned = connections.filter((connection) => connection.authentication.mode !== "cloud");

	useConfigStore.setState((s) => {
		s.connections = pruned;
	});
}
