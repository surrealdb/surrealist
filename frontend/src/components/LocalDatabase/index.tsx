import { StartDatabase, StopDatabase } from "$/go/backend/Surrealist";
import { Button, Loader } from "@mantine/core";
import { mdiPlay, mdiStop } from "@mdi/js";
import { useEffect, useMemo } from "react";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { Icon } from "../Icon";

const ENDPOINT_PATTERN = /^https?:\/\/([\w\d\.]+):(\d+)\/?/i;
const LOCAL_ENDPOINTS = [ '127.0.0.1', 'localhost' ];

export interface LocalDatabaseProps {
	openConnection: () => void;
	closeConnection: () => void;
}

export function LocalDatabase(props: LocalDatabaseProps) {
	const isLight = useIsLight();
	const activeTab = useActiveTab();
	const isServing = useStoreValue(state => state.isServing);
	const isPending = useStoreValue(state => state.servePending);
	const localDriver = useStoreValue(state => state.localDriver);
	const localPath = useStoreValue(state => state.localStorage);

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
		if (isPending) {
			return;
		}

		const { username, password } = activeTab!.connection;

		if (isServing) {
			props.closeConnection();
			StopDatabase();
		} else {
			if(!activeTab) {
				return;
			}

			StartDatabase(username, password, port || 80, localDriver, localPath);

			store.dispatch(actions.prepareServe(activeTab.id));
		}
	});

	const isActive = isServing && !isPending;
	const isDisabled = !isLocal && !isPending && !isServing;

	useEffect(() => {
		if (isActive) {
			props.openConnection();
		}
	}, [isActive]);

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