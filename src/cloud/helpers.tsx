import { useConfigStore } from "~/stores/config";
import { CloudOrganization } from "~/types";

export function clearCachedConnections() {
	const { connections } = useConfigStore.getState();

	const pruned = connections.filter((connection) => connection.authentication.mode !== "cloud");

	useConfigStore.setState((s) => {
		s.connections = pruned;
	});
}

export function createInstancePath(organization?: CloudOrganization) {
	if (!organization) {
		return "/create/instance";
	}

	return `/create/instance?organization=${organization.id}`;
}
