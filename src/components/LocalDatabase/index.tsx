import { Button, Loader } from "@mantine/core";
import { useHotkeys } from "@mantine/hooks";
import { mdiPlay, mdiStop } from "@mdi/js";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { actions, store, useStoreValue } from "~/store";
import { Icon } from "../Icon";

export interface LocalDatabaseProps {
	openConnection: () => void;
	closeConnection: () => void;
}

export function LocalDatabase(props: LocalDatabaseProps) {
	const isLight = useIsLight();
	const isServing = useStoreValue(state => state.isServing);
	const isPending = useStoreValue(state => state.servePending);
	const localDriver = useStoreValue(state => state.config.localDriver);
	const localPath = useStoreValue(state => state.config.localStorage);
	const surrealPath = useStoreValue(state => state.config.surrealPath);
	const surrealUser = useStoreValue(state => state.config.surrealUser);
	const surrealPass = useStoreValue(state => state.config.surrealPass);
	const surrealPort = useStoreValue(state => state.config.surrealPort);

	const handleToggle = useStable(() => {
		if (isPending) {
			return;
		}

		if (isServing) {
			props.closeConnection();
			adapter.stopDatabase();

			store.dispatch(actions.cancelServe());
		} else {
			store.dispatch(actions.prepareServe());
			
			adapter.startDatabase(surrealUser, surrealPass, surrealPort, localDriver, localPath, surrealPath).catch(() => {
				store.dispatch(actions.stopServing());
			});
		}
	});

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
				color={isServing ? 'red' : (isLight ? 'light.0' : 'dark.4')}
				title={isServing ? 'Stop local database' : 'Start local database'}
				style={{ opacity: isPending ? 0.5 : 1 }}
				disabled={isPending}
				onClick={handleToggle}
			>
				{isPending ? (
					<Loader size="xs" color="blue" mx={1} />
				) : (
					<Icon
						path={isServing ? mdiStop : mdiPlay}
						color={isServing ? 'white' : (isLight ? 'light.8' : 'white')}
					/>
				)}
			</Button>
		</>
	);
}