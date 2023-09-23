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

import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { PropsWithChildren } from "react";
import { Toolbar } from "../Toolbar";
import { useActiveTab } from "~/hooks/environment";
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

function ViewSlot(props: PropsWithChildren<{ visible: boolean }>) {
	return <div style={{ display: props.visible ? "initial" : "none" }}>{props.children}</div>;
}

export function Scaffold() {
	const tabInfo = useActiveTab();
	const activeTab = useStoreValue((state) => state.config.activeTab);
	const enableConsole = useStoreValue((state) => state.config.enableConsole);

	const viewMode = tabInfo?.activeView || "query";

	const openTabCreator = useStable((envId?: string) => {
		store.dispatch(
			actions.openTabCreator({
				environment: envId,
			})
		);
	});

	const createNewTab = useStable(() => {
		openTabCreator();
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
				viewMode={viewMode}
				onCreateTab={openTabCreator}
			/>

			{activeTab ? (
				<>
					<Group p="xs">
						<ViewListing
							viewMode={viewMode}
						/>
						
						<AddressBar
							viewMode={viewMode}
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
							<ViewSlot visible={viewMode == "query"}>
								<QueryView />
							</ViewSlot>

							<ViewSlot visible={viewMode == "explorer"}>
								<ExplorerView />
							</ViewSlot>

							<ViewSlot visible={viewMode == "designer"}>
								<DesignerView />
							</ViewSlot>

							<ViewSlot visible={viewMode == "auth"}>
								<AuthenticationView />
							</ViewSlot>

							<ViewSlot visible={viewMode == "live"}>
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
