import classes from "./style.module.scss";
import { Group, Paper, clsx, ActionIcon, Button, useMantineTheme, Text } from "@mantine/core";
import { mdiClose, mdiRefresh } from "@mdi/js";
import { closeConnection, openConnection } from "~/database";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { MouseEvent, useEffect } from "react";
import { useSession, useEnvironment } from "~/hooks/environment";
import { mergeConnections, isConnectionValid } from "~/util/environments";
import { useIsLight } from "~/hooks/theme";
import { ViewMode } from "~/types";
import { openTabEditor } from "~/stores/interface";
import { fetchDatabaseSchema } from "~/util/schema";

export interface AddressBarProps {
	viewMode: ViewMode;
	onQuery: () => void;
}

export function AddressBar({ viewMode, onQuery }: AddressBarProps) {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const isConnected = useStoreValue((state) => state.database.isConnected);
	const isConnecting = useStoreValue((state) => state.database.isConnecting);
	const isQuerying = useStoreValue((state) => state.database.isQueryActive);
	const autoConnect = useStoreValue((state) => state.config.autoConnect);

	const sessionInfo = useSession();
	const envInfo = useEnvironment();

	const connection = mergeConnections(sessionInfo?.connection || {}, envInfo?.connection || {});
	const connectionValid = isConnectionValid(connection);

	const borderColor = theme.fn.themeColor(isConnected ? "surreal" : connectionValid ? "light" : "red");
	const showQuery = viewMode == "query";

	const handleCloseConnection = useStable((e: MouseEvent) => {
		e.stopPropagation();
		closeConnection();
	});

	const handleFetchSchema = useStable((e: MouseEvent) => {
		e.stopPropagation();
		fetchDatabaseSchema();
	});

	const showTabEditor = useStable(() => {
		if (!sessionInfo) {
			return;
		}

		store.dispatch(openTabEditor(sessionInfo.id));
	});

	useEffect(() => {
		if (sessionInfo && autoConnect && connectionValid) {
			openConnection();
		}
	}, [sessionInfo?.id]);

	return (
		<Group className={classes.inputWrapper}>
			<Paper
				className={clsx(
					classes.input,
					connectionValid && (!isConnected || showQuery) && classes.inputWithButton
				)}
				onClick={showTabEditor}
				style={{ borderColor: borderColor }}
			>
				{isConnected ? (
					connection.authMode == "none" ? (
						<Paper bg={isLight ? "light.0" : "light.6"} c={isLight ? "light.4" : "light.3"} fs="italic" px="xs">
							Anon
						</Paper>
					) : connection.authMode == "scope" ? (
						<Paper bg={isLight ? "light.0" : "light.6"} c={isLight ? "light.4" : "light.3"} fs="italic" px="xs">
							{connection.scope}
						</Paper>
					) : (
						<Paper bg={isLight ? "light.0" : "light.6"} c={isLight ? "light.6" : "white"} px="xs">
							{connection.username}
						</Paper>
					)
				) : (
					<Paper bg="light" px="xs">
						<Text color="white" size="xs" py={2} weight={600}>
							OFFLINE
						</Text>
					</Paper>
				)}
				<Text color={isLight ? "light.6" : "white"}>{connection.endpoint}</Text>
				<Spacer />
				{!connectionValid && (
					<Text color="red" mr="xs">
						Connection details incomplete
					</Text>
				)}
				{isConnected && (
					<>
						<ActionIcon onClick={handleFetchSchema} title="Refetch schema">
							<Icon color="light.4" path={mdiRefresh} />
						</ActionIcon>
						<ActionIcon onClick={handleCloseConnection} title="Disconnect">
							<Icon color="light.4" path={mdiClose} />
						</ActionIcon>
					</>
				)}
			</Paper>

			{connectionValid && isConnected && showQuery && (
				<Button
					color="surreal"
					onClick={onQuery}
					className={classes.sendButton}
					title="Send Query (F9)"
					loading={isQuerying}
				>
					Send Query
				</Button>
			)}

			{connectionValid && !isConnected && (
				<Button
					color="light"
					className={classes.sendButton}
					onClick={openConnection.bind(null, false)}
				>
					{isConnecting ? "Connecting..." : "Connect"}
				</Button>
			)}
		</Group>
	);
}