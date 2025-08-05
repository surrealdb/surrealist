import { createContext, PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import Surreal from "surrealdb";
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

	const connect = useStable(() => {
		console.log("Connecting to Surreal Cloud instance");
		surreal.connect(CONTEXT_ENDPOINT, {
			namespace: "surrealdb",
			database: "cloud",
		});
	});

	useEffect(() => {
		if (initializedRef.current) return;

		surreal.emitter.subscribe("connecting", () => {
			adapter.log("Cloud", "Attempting to connect to Surreal Cloud instance");
		});

		surreal.emitter.subscribe("connected", () => {
			adapter.log("Cloud", "Connected to Surreal Cloud instance");
			setConnected(true);
		});

		surreal.emitter.subscribe("disconnected", () => {
			adapter.log("Cloud", "Disconnected from Surreal Cloud instance");
			setConnected(false);
			setTimeout(connect, 3000);
		});

		surreal.emitter.subscribe("error", (error) => {
			console.error(error);
		});

		initializedRef.current = true;
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
