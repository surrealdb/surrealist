import { useMemo } from "react";
import { useConnection } from "~/hooks/connection";
import { createBaseAuthentication } from "~/util/defaults";
import { connectionUri } from "~/util/helpers";

export function useDocsConnection() {
	const auth = useConnection((c) => c?.authentication ?? createBaseAuthentication());

	return useMemo(() => {
		const endpoint = connectionUri(auth.protocol, auth.hostname);
		const endpointJava = endpoint.replace(/\/rpc\/?$/, "");

		return {
			auth,
			endpoint,
			esc_endpoint: JSON.stringify(endpoint),
			esc_endpoint_java: JSON.stringify(endpointJava),
			esc_namespace: JSON.stringify(auth.namespace),
			esc_database: JSON.stringify(auth.database),
		};
	}, [auth]);
}
