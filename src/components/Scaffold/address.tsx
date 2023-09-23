import classes from "./style.module.scss";
import { Group, Paper, clsx, ActionIcon, Button, useMantineTheme, Text } from "@mantine/core";
import { mdiConsole, mdiClose } from "@mdi/js";
import { adapter } from "~/adapter";
import { closeConnection, openConnection } from "~/database";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { MouseEvent, useEffect } from "react";
import { useActiveTab, useActiveEnvironment } from "~/hooks/environment";
import { mergeConnections, isConnectionValid } from "~/util/environments";
import { useIsLight } from "~/hooks/theme";
import { ViewMode } from "~/types";

export interface AddressBarProps {
	viewMode: ViewMode;
	onQuery: () => void;
}

export function AddressBar({ viewMode, onQuery }: AddressBarProps) {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const isConnected = useStoreValue((state) => state.isConnected);
	const isConnecting = useStoreValue((state) => state.isConnecting);
	const isQuerying = useStoreValue((state) => state.isQueryActive);
	const autoConnect = useStoreValue((state) => state.config.autoConnect);
	const enableConsole = useStoreValue((state) => state.config.enableConsole);

	const tabInfo = useActiveTab();
	const envInfo = useActiveEnvironment();

	const connection = mergeConnections(tabInfo?.connection || {}, envInfo?.connection || {});
	const connectionValid = isConnectionValid(connection);

	const borderColor = theme.fn.themeColor(isConnected ? "surreal" : connectionValid ? "light" : "red");
	const showQuery = viewMode == "query" || viewMode == "live";

	const handleCloseConnection = useStable((e: MouseEvent) => {
		e.stopPropagation();
		closeConnection();
	});

	const revealConsole = useStable((e: MouseEvent) => {
		e.stopPropagation();
		store.dispatch(actions.setConsoleEnabled(!enableConsole));
	});

	const openTabEditor = useStable(() => {
		if (!tabInfo) {
			return;
		}

		store.dispatch(actions.openTabEditor(tabInfo.id));
	});

	useEffect(() => {
		if (tabInfo && autoConnect && connectionValid) {
			openConnection();
		}
	}, [tabInfo?.id]);

	return (
		<Group className={classes.inputWrapper}>
			<Paper
				className={clsx(
					classes.input,
					connectionValid && (!isConnected || showQuery) && classes.inputWithButton
				)}
				onClick={openTabEditor}
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
				{adapter.isServeSupported && (
					<ActionIcon onClick={revealConsole} title="Toggle console">
						<Icon color="light.4" path={mdiConsole} />
					</ActionIcon>
				)}
				{isConnected && (
					<ActionIcon onClick={handleCloseConnection} title="Disconnect">
						<Icon color="light.4" path={mdiClose} />
					</ActionIcon>
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