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
import { PropsWithChildren } from "react";
import { Toolbar } from "../Toolbar";
import { useSession } from "~/hooks/environment";
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

function ViewSlot(props: PropsWithChildren<{ visible: boolean }>) {
	return <div style={{ display: props.visible ? "initial" : "none" }}>{props.children}</div>;
}

export function Scaffold() {
	const sessionInfo = useSession();
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
							<ViewSlot visible={activeView == "query"}>
								<QueryView />
							</ViewSlot>

							<ViewSlot visible={activeView == "explorer"}>
								<ExplorerView />
							</ViewSlot>

							<ViewSlot visible={activeView == "designer"}>
								<DesignerView />
							</ViewSlot>

							<ViewSlot visible={activeView == "auth"}>
								<AuthenticationView />
							</ViewSlot>

							<ViewSlot visible={activeView == "live"}>
								<LiveView />
							</ViewSlot>
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
