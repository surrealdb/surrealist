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
	const [authenticated, setAuthenticated] = useState(false);
	const initializedRef = useRef(false);

	const connect = useStable(() => {
		console.log("Connecting to Surreal Cloud instance");
		surreal.connect(CONTEXT_ENDPOINT, {
			namespace: "surrealdb",
			database: "cloud",
			reconnect: {
				enabled: true,
				attempts: -1,
				retryDelayMultiplier: 1.2,
				retryDelayJitter: 0,
			},
		});
	});

	useEffect(() => {
		if (initializedRef.current) return;

		surreal.subscribe("connecting", () => {
			adapter.log("Cloud", "Attempting to connect to Surreal Cloud instance");
		});

		surreal.subscribe("connected", () => {
			adapter.log("Cloud", "Connected to Surreal Cloud instance");
		});

		surreal.subscribe("disconnected", () => {
			adapter.log("Cloud", "Disconnected from Surreal Cloud instance");
		});

		surreal.subscribe("error", (error) => {
			console.error(error);
		});

		initializedRef.current = true;
		connect();
	}, [surreal]);

	useEffect(() => {
		if (!surreal || surreal.status !== "connected") return;

		if (accessToken) {
			surreal.authenticate(accessToken).then(() => {
				setAuthenticated(true);
			});
		} else {
			surreal.invalidate().then(() => {
				setAuthenticated(false);
			});
		}
	}, [surreal, accessToken]);

	const connected = surreal.status === "connected";

	return (
		<ContextContext.Provider value={{ surreal, connected, authenticated }}>
			{children}
		</ContextContext.Provider>
	);
}
