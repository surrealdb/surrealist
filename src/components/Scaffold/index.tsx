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
import { Toolbar } from "../Toolbar";
import { Splitter } from "../Splitter";
import { ConsolePane } from "../ConsolePane";
import { useHotkeys } from "@mantine/hooks";
import { adapter } from "~/adapter";
import { TabCreator } from "./creator";
import { TabEditor } from "./editor";
import { executeQuery } from "~/database";
import { AddressBar } from "./address";
import { ViewListing } from "./listing";
import { openTabCreator } from "~/stores/interface";
import { InPortal, OutPortal, createHtmlPortalNode, HtmlPortalNode } from "react-reverse-portal";
import { QueryView } from "~/views/query/QueryView";
import { ViewMode } from "~/types";
import { ExplorerView } from "~/views/explorer/ExplorerView";
import { DesignerView } from "~/views/designer/DesignerView";
import { AuthenticationView } from "~/views/authentication/AuthenticationView";
import { LiveView } from "~/views/live/LiveView";

const PORTAL_ATTRS = {
	attributes: {
		style: "height: 100%"
	}
};

const VIEW_PORTALS: Record<ViewMode, HtmlPortalNode> = {
	query: createHtmlPortalNode(PORTAL_ATTRS),
	explorer: createHtmlPortalNode(PORTAL_ATTRS),
	designer: createHtmlPortalNode(PORTAL_ATTRS),
	authentication: createHtmlPortalNode(PORTAL_ATTRS),
	live: createHtmlPortalNode(PORTAL_ATTRS),
};

export function Scaffold() {
	const activeSession = useStoreValue((state) => state.config.activeTab);
	const enableConsole = useStoreValue((state) => state.config.enableConsole);
	const activeView = useStoreValue((state) => state.config.activeView);

	const viewNode = VIEW_PORTALS[activeView];

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
							{viewNode && <OutPortal node={viewNode} />}
						</Splitter>
					</Box>

					<InPortal node={VIEW_PORTALS.query}>
						<QueryView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.explorer}>
						<ExplorerView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.designer}>
						<DesignerView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.authentication}>
						<AuthenticationView />
					</InPortal>

					<InPortal node={VIEW_PORTALS.live}>
						<LiveView />
					</InPortal>
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
