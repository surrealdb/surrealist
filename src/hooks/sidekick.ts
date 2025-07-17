import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import Surreal from "surrealdb";
import { useCloudStore } from "~/stores/cloud";
import { SidekickChat } from "~/types";

const SIDEKICK_ENDPOINT = "https://surreal-cloud-06bu9hntp1rdd9dgg57rc0v87s.aws-euw1.surreal.cloud";

export function useSidekickConnection() {
	const { accessToken } = useCloudStore.getState();

	const surrealRef = useRef(new Surreal());
	const [isConnected, setIsConnected] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		surrealRef.current.emitter.subscribe("connected", () => {
			setIsConnected(true);
		});

		surrealRef.current.connect(SIDEKICK_ENDPOINT, {
			namespace: "surrealdb",
			database: "cloud",
		});

		return () => {
			surrealRef.current.close();
		};
	}, []);

	useEffect(() => {
		if (!isConnected) return;

		if (accessToken) {
			surrealRef.current.authenticate(accessToken).then(() => {
				setIsAuthenticated(true);
			});
		} else {
			surrealRef.current.invalidate().then(() => {
				setIsAuthenticated(false);
			});
		}
	}, [isConnected, accessToken]);

	return [surrealRef.current, isConnected, isAuthenticated] as const;
}

export function useSidekickConversations(isOpen: boolean) {
	const [surreal, isConnected, isAuthenticated] = useSidekickConnection();

	return useQuery({
		queryKey: ["sidekick", "conversations"],
		enabled: isOpen && isConnected && isAuthenticated,
		refetchInterval: 1000,
		queryFn: async () => {
			const [conversations] = await surreal.query<[SidekickChat[]]>("SELECT * FROM sidekick_conversation");

			return conversations;
		},
	});
}