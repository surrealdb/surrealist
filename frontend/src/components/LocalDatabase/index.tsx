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
	const localDriver = useStoreValue(state => state.config.localDriver);
	const localPath = useStoreValue(state => state.config.localStorage);

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

			store.dispatch(actions.cancelServe());
		} else {
			if(!activeTab) {
				return;
			}

			StartDatabase(username, password, port || 80, localDriver, localPath);

			store.dispatch(actions.prepareServe(activeTab.id));
		}
	});

	const showLoading = !isLocal || isPending;

	useEffect(() => {
		if (isServing) {
			props.openConnection();
		}
	}, [isServing]);

	return (
		<>
			<Button
				px="xs"
				color={isServing ? 'red' : isLight ? 'light.0' : 'dark.4'}
				title={isServing ? 'Stop local database' : 'Start local database'}
				style={{ opacity: showLoading ? 0.5 : 1 }}
				disabled={showLoading}
				onClick={handleToggle}
			>
				{isPending ? (
					<Loader size="xs" color="blue" mx={1} />
				) : (
					<Icon
						path={isServing ? mdiStop : mdiPlay}
						color={isServing ? 'white' : isLight ? 'light.8' : 'white'}
					/>
				)}
			</Button>
		</>
	)
}