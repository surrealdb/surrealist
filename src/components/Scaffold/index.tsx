import classes from "./style.module.scss";
import surrealistLogo from "~/assets/icon.png";

import {
	Box,
	Button,
	Center,
	Group,
	Image,
	Text,
	Title,
} from "@mantine/core";

import { store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { useMemo } from "react";
import { Toolbar } from "../Toolbar";
import { Splitter } from "../Splitter";
import { ConsolePane } from "../ConsolePane";
import { QueryView } from "~/views/query/QueryView";
import { ExplorerView } from "~/views/explorer/ExplorerView";
import { useHotkeys } from "@mantine/hooks";
import { DesignerView } from "~/views/designer/DesignerView";
import { AuthenticationView } from "~/views/authentication/AuthenticationView";
import { adapter } from "~/adapter";
import { TabCreator } from "./creator";
import { TabEditor } from "./editor";
import { LiveView } from "~/views/live/LiveView";
import { executeQuery } from "~/database";
import { AddressBar } from "./address";
import { ViewListing } from "./listing";
import { openTabCreator } from "~/stores/interface";

const VIEW_ELEMENTS = {
	query: <QueryView />,
	explorer: <ExplorerView />,
	designer: <DesignerView />,
	auth: <AuthenticationView />,
	live: <LiveView />,
};

export function Scaffold() {
	const activeView = useStoreValue((state) => state.config.activeView);
	const activeSession = useStoreValue((state) => state.config.activeTab);
	const enableConsole = useStoreValue((state) => state.config.enableConsole);

	const showTabCreator = useStable((envId?: string) => {
		store.dispatch(openTabCreator({
			environment: envId,
		}));
	});

	const createNewTab = useStable(() => {
		showTabCreator();
	});

	const userExecuteQuery = useStable(() => {
		executeQuery({
			loader: true
		});
	});

	const activeViewElement = useMemo(() => {
		return VIEW_ELEMENTS[activeView];
	}, [activeView]);

	useHotkeys([
		["F9", () => userExecuteQuery()],
		["mod+Enter", () => userExecuteQuery()],
	]);

	return (
		<div className={classes.root}>
			<Toolbar
				viewMode={activeView}
				onCreateTab={showTabCreator}
			/>

			{activeSession ? (
				<>
					<Group p="xs">
						<ViewListing
							viewMode={activeView}
						/>
						
						<AddressBar
							viewMode={activeView}
							onQuery={userExecuteQuery}
						/>
					</Group>

					<Box p="xs" className={classes.content}>
						<Splitter
							minSize={100}
							bufferSize={200}
							direction="vertical"
							endPane={adapter.isServeSupported && enableConsole && <ConsolePane />}
						>
							{activeViewElement}
						</Splitter>
					</Box>
				</>
			) : (
				<Center h="100%">
					<div>
						<Image className={classes.emptyImage} src={surrealistLogo} width={120} mx="auto" />
						<Title color="light" align="center" mt="md">
							Surrealist
						</Title>
						<Text color="light.2" align="center">
							Open or create a new session to continue
						</Text>
						<Center mt="lg">
							<Button size="xs" onClick={createNewTab}>
								Create session
							</Button>
						</Center>
					</div>
				</Center>
			)}

			<TabCreator />

			<TabEditor />
		</div>
	);
}
