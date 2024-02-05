import classes from "./style.module.scss";
import { Group, Paper, clsx, ActionIcon, Button, useMantineTheme, Text } from "@mantine/core";
import { mdiClose, mdiDelete, mdiRefresh } from "@mdi/js";
import { closeConnection, openConnection } from "~/database";
import { Icon } from "../Icon";
import { Spacer } from "../Spacer";
import { useStable } from "~/hooks/stable";
import { MouseEvent, useEffect } from "react";
import { useSession, useEnvironment } from "~/hooks/environment";
import { mergeConnections, isConnectionValid } from "~/util/environments";
import { useIsLight } from "~/hooks/theme";
import { ViewMode } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";
import { surrealIcon } from "~/util/icons";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import { showNotification } from "@mantine/notifications";

export interface AddressBarProps {
	viewMode: ViewMode;
	onQuery: () => void;
}

export function AddressBar({ viewMode, onQuery }: AddressBarProps) {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const isConnected = useDatabaseStore((s) => s.isConnected);
	const isConnecting = useDatabaseStore((s) => s.isConnecting);
	const isQuerying = useDatabaseStore((s) => s.isQueryActive);
	const autoConnect = useConfigStore((s) => s.autoConnect);
	const openTabEditor = useInterfaceStore((s) => s.openTabEditor);

	const sessionInfo = useSession();
	const envInfo = useEnvironment();

	const connection = mergeConnections(sessionInfo?.connection || {}, envInfo?.connection || {});
	const connectionValid = isConnectionValid(connection);
	const isRemote = connection.method === "remote";

	const borderColor = theme.fn.themeColor(isConnected ? "surreal" : connectionValid ? "light" : "red");
	const showQuery = viewMode == "query";

	console.log(viewMode);

	const handleCloseConnection = useStable((e: MouseEvent) => {
		e.stopPropagation();
		closeConnection();
	});

	const handleClearMemory = useStable((e: MouseEvent) => {
		e.stopPropagation();
		closeConnection();
		openConnection();

		showNotification({
			message: "Sandbox environment has been cleaned",
		});
	});

	const handleFetchSchema = useStable((e: MouseEvent) => {
		e.stopPropagation();
		fetchDatabaseSchema();
	});

	const showTabEditor = useStable(() => {
		if (!sessionInfo) {
			return;
		}

		openTabEditor(sessionInfo.id);
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
				{isRemote ? (
					<>
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
						<Text color={isLight ? "light.6" : "white"}>
							{connection.endpoint}
						</Text>
					</>
				) : (
					<>
						<Icon path={surrealIcon} color="surreal" />
						<Group spacing={6}>
							<Text color={isLight ? "light.6" : "white"}>
								Surrealist Sandbox
							</Text>
						</Group>
					</>
				)}
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
						{isRemote ? (
							<ActionIcon onClick={handleCloseConnection} title="Disconnect">
								<Icon color="light.4" path={mdiClose} />
							</ActionIcon>
						) : (
							<ActionIcon onClick={handleClearMemory} title="Clean sandbox">
								<Icon color="light.4" path={mdiDelete} />
							</ActionIcon>
						)}
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