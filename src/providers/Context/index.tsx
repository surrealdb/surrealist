import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import Surreal from "surrealdb";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { __throw } from "~/util/helpers";

const CONTEXT_ENDPOINT = "wss://surreal-cloud-06bu9hntp1rdd9dgg57rc0v87s.aws-euw1.surreal.cloud";

const ContextContext = createContext<{
	surreal: Surreal;
	connected: boolean;
	authenticated: boolean;
	initialize: () => void;
} | null>(null);

/**
 * Access the Surreal Context connection
 */
export function useContextConnection() {
	const ctx = useContext(ContextContext) ?? __throw("Missing ContextProvider");

	useEffect(() => {
		ctx.initialize();
	}, [ctx.initialize]);

	return [ctx.surreal, ctx.connected && ctx.authenticated] as const;
}

export function ContextProvider({ children }: PropsWithChildren) {
	const accessToken = useCloudStore((s) => s.accessToken);

	const [surreal] = useState(new Surreal());
	const [initialized, setInitialized] = useState(false);
	const [connected, setConnected] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);

	const connect = useStable(() => {
		surreal.connect(CONTEXT_ENDPOINT, {
			namespace: "surrealdb",
			database: "cloud",
		});
	});

	const initialize = useStable(() => {
		if (initialized) return;

		surreal.emitter.subscribe("connected", () => {
			setConnected(true);
		});

		surreal.emitter.subscribe("disconnected", () => {
			setConnected(false);
			setTimeout(connect, 3000);
		});

		setInitialized(true);
		connect();
	});

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
		<ContextContext.Provider value={{ surreal, connected, authenticated, initialize }}>
			{children}
		</ContextContext.Provider>
	);
}
