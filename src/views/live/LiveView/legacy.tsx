import { Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { mdiAlert } from "@mdi/js";
import { useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { Icon } from "~/components/Icon";
import { useActiveSession } from "~/hooks/environment";
import { useStable } from "~/hooks/stable";
import { LiveMessage } from "~/types";
import { getActiveSession, getActiveEnvironment, mergeConnections, isConnectionValid } from "~/util/environments";
import { newId } from "~/util/helpers";
import { SurrealHandle, CLOSED_HANDLE, createLocalWebSocket } from "~/util/websocket";

let hasShownWarning = false;

export interface SocketOptions {
	onLiveMessage?: (msg: LiveMessage) => void;
	onOpen?: () => void;
	onConnect?: () => void;
	onDisconnect?: () => void;
}

export function useLegacyLiveSocket(options: SocketOptions) {
	const session = useActiveSession();
	const [handle, setHandle] = useState<SurrealHandle>(CLOSED_HANDLE);
	const [tokenMap, setTokenMap] = useImmer<Record<string, string>>({});

	const processLiveResponse = useStable((data: any) => {
		const queryId = tokenMap[data.id];
		
		if (!queryId) {
			console.error('Received unknown live signal', data.id);
			return;
		}

		const query = session.liveQueries.find((q) => q.id === queryId);

		if (!query) {
			console.error('Received live signal for unknown query', queryId);
			return;
		}

		options.onLiveMessage?.({
			query,
			id: newId(),
			action: data.action,
			result: data.result,
			timestamp: Date.now(),
		});
	});

	const openConnection = useStable(async () => {
		if (handle !== CLOSED_HANDLE) {
			return;
		}

		const sessionInfo = getActiveSession();
		const envInfo = getActiveEnvironment();

		const connection = mergeConnections(sessionInfo?.connection || {}, envInfo?.connection || {});
		const connectionValid = isConnectionValid(connection);

		if (!connectionValid) {
			showNotification({
				color: "red.4",
				bg: "red.6",
				message: (
					<div>
						<Text color="white" weight={600}>
							Invalid Connection
						</Text>
						<Text color="white" opacity={0.8} size="sm">
							Please check your connection details
						</Text>
					</div>
				),
			});
			
			return;
		}

		// NOTE - WebSocket disclaimer
		if (!hasShownWarning) {
			hasShownWarning = true;

			showNotification({
				autoClose: 10_000,
				color: 'orange',
				message: (
					<Stack spacing={0}>
						<Text weight={600}>
							<Icon
								path={mdiAlert}
								size="sm"
								left
								mt={-2}
							/>
							Live queries are experimental
						</Text>
						<Text color="gray.6">
							Due to existing limitations of live queries a local WebSocket connection is used. This may not be available in all environments.
						</Text>
					</Stack>
				)
			});
		}

		return new Promise<void>((resolve, reject) => {
			options.onOpen?.();
			
			const newHandle = createLocalWebSocket({
				connection,
				onConnect() {
					resolve();
					options.onConnect?.();
				},
				onDisconnect() {
					setHandle(CLOSED_HANDLE);
					setTokenMap({});
					reject();
					options.onDisconnect?.();
				},
				onLiveResponse(data) {
					processLiveResponse(data);
				},
			});
	
			setHandle(newHandle);
		});
	});

	const closeConnection = useStable(() => {
		handle?.close();
	});

	const killQuery = useStable(async (id: string) => {
		const tokenId = Object.keys(tokenMap).find((key) => tokenMap[key] === id);

		if (!tokenId) {
			throw new Error('Query not active');
		}

		setTokenMap((draft) => {
			delete draft[tokenId];
		});

		await handle.query(`KILL "${tokenId}"`);
	});

	const startQuery = useStable(async (id: string) => {
		if (tokenMap[id]) {
			throw new Error('Query already started');
		}

		const query = session.liveQueries.find((q) => q.id === id);

		if (!query) {
			return;
		}

		const [{ result }] = await handle.querySingle(query.text);

		setTokenMap((draft) => {
			draft[result] = id;
		});
	});

	useEffect(() => {
		closeConnection();
	}, [session.id]);

	return {
		openConnection,
		closeConnection,
		killQuery,
		startQuery,
	};
}