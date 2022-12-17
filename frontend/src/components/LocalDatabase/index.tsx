import { StartDatabase, StopDatabase } from "$/go/backend/Surrealist";
import { Button, Loader, Stack, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { mdiPlay, mdiStop } from "@mdi/js";
import { useMemo, useState } from "react";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { showOnlineAlert } from "~/util/database";
import { Icon } from "../Icon";

const WAIT_DURATION = 1000;
const ENDPOINT_PATTERN = /^https?:\/\/([\w\d\.]+):(\d+)\/?/i;
const LOCAL_ENDPOINTS = [ '127.0.0.1', 'localhost' ];

export interface LocalDatabaseProps {
	openConnection: () => void;
	closeConnection: () => void;
}

export function LocalDatabase(props: LocalDatabaseProps) {
	const isLight = useIsLight();
	const activeTab = useActiveTab();
	const isRunning = useStoreValue(state => state.isServing);
	const localDriver = useStoreValue(state => state.localDriver);
	const localPath = useStoreValue(state => state.localStorage);
	const [isPending, setIsPending] = useState(false);

	const endpoint = activeTab?.connection?.endpoint;

	const [isLocal, port] = useMemo(() => {
		const [_, hostname, port] = ENDPOINT_PATTERN.exec(endpoint || '') || [];

		if (!hostname || !port) {
			return [false];
		}

		const isValid = LOCAL_ENDPOINTS.includes(hostname);
		const portNum = parseInt(port);

		return [isValid, portNum];
	}, [endpoint]);

	const handleToggle = useStable(() => {
		const { username, password } = activeTab!.connection;

		if (isRunning) {
			props.closeConnection();
			StopDatabase();
		} else {
			if(!activeTab) {
				return;
			}

			StartDatabase(username, password, port || 80, localDriver, localPath);
			setIsPending(true);

			store.dispatch(actions.setServingTab(activeTab.id));

			setTimeout(() => {
				showOnlineAlert();
				setIsPending(false);
				props.openConnection();
			}, WAIT_DURATION);
		}
	});

	const isActive = isRunning && !isPending;
	const isDisabled = !isLocal && !isPending && !isRunning;

	return (
		<>
			<Button
				px="xs"
				color={isActive ? 'red' : isLight ? 'light.0' : 'dark.4'}
				title={isActive ? 'Stop local database' : 'Start local database'}
				style={{ opacity: isDisabled ? 0.5 : 1 }}
				disabled={isDisabled}
				onClick={handleToggle}
			>
				{isPending ? (
					<Loader size="xs" color="blue" mx={1} />
				) : (
					<Icon
						path={isActive ? mdiStop : mdiPlay}
						color={isActive ? 'white' : isLight ? 'light.8' : 'white'}
					/>
				)}
			</Button>
		</>
	)
}