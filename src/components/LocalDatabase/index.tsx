import { Button, Loader } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { mdiPlay, mdiStop } from "@mdi/js";
import { useEffect, useMemo } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/environment";
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
	const surrealPath = useStoreValue(state => state.config.surrealPath);

	const { endpoint, authMode } = activeTab?.connection || {};

	const [isLocal, port] = useMemo(() => {
		const [_, hostname, port] = ENDPOINT_PATTERN.exec(endpoint || '') || [];

		if (!hostname || !port) {
			return [false];
		}

		const isValid = LOCAL_ENDPOINTS.includes(hostname) && authMode == 'root';
		const portNum = parseInt(port);

		return [isValid, portNum];
	}, [endpoint, authMode]);

	const handleToggle = useStable(() => {
		if (isPending) {
			return;
		}

		const { username, password } = activeTab!.connection;

		if (isServing) {
			props.closeConnection();
			adapter.stopDatabase();

			store.dispatch(actions.cancelServe());
		} else {
			if(!activeTab) {
				return;
			}

			adapter.startDatabase(username, password, port || 80, localDriver, localPath, surrealPath);
			store.dispatch(actions.prepareServe(activeTab.id));
		}
	});

	const showLoading = !isLocal || isPending;

	useEffect(() => {
		if (isServing) {
			props.openConnection();
		}
	}, [isServing]);

	useHotkeys([
		['ctrl+s', handleToggle],
	], []);

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