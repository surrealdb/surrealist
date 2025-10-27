import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { Surreal } from "surrealdb";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { __throw } from "~/util/helpers";

const CONTEXT_ENDPOINT = "wss://surreal-cloud-06bu9hntp1rdd9dgg57rc0v87s.aws-euw1.surreal.cloud";

const ContextContext = createContext<{
	surreal: Surreal;
	connected: boolean;
	authenticated: boolean;
} | null>(null);

/**
 * Access the Surreal Context connection
 */
export function useContextConnection() {
	const ctx = useContext(ContextContext) ?? __throw("Missing ContextProvider");
	return [ctx.surreal, ctx.connected && ctx.authenticated] as const;
}

export function ContextProvider({ children }: PropsWithChildren) {
	const accessToken = useCloudStore((s) => s.accessToken);

	const [surreal] = useState(new Surreal());
	const [connected, setConnected] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);
	const initializedRef = useRef(false);

	const connect = useStable(() => {});

	useEffect(() => {
		if (initializedRef.current) return;

		surreal.subscribe("connecting", () => {
			adapter.log("Context", "Attempting to connect to SurrealDB Cloud instance");
		});

		surreal.subscribe("connected", () => {
			adapter.log("Context", "Connected to SurrealDB Cloud instance");
			setConnected(true);
		});

		surreal.subscribe("disconnected", () => {
			adapter.log("Context", "Disconnected from SurrealDB Cloud instance");
			setConnected(false);
			setTimeout(connect, 3000);
		});

		surreal.subscribe("error", (error) => {
			console.error(error);
		});

		initializedRef.current = true;

		adapter.log("Context", "Connecting to SurrealDB Cloud instance");
		surreal.connect(CONTEXT_ENDPOINT, {
			namespace: "surrealdb",
			database: "cloud",
		});
		connect();
	}, [surreal]);

	useEffect(() => {
		if (!surreal || !connected) return;

		if (accessToken) {
			surreal.authenticate(accessToken).then(() => {
				setAuthenticated(true);
			});
		} else {
			surreal.invalidate().then(() => {
				setAuthenticated(false);
			});
		}
	}, [surreal, connected, accessToken]);

	return (
		<ContextContext.Provider value={{ surreal, connected, authenticated }}>
			{children}
		</ContextContext.Provider>
	);
}
