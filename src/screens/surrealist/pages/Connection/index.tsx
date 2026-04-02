import { Stack } from "@mantine/core";
import { FC, memo, Suspense } from "react";
import { createHtmlPortalNode, HtmlPortalNode, InPortal, OutPortal } from "react-reverse-portal";
import { Redirect } from "wouter";
import { useAvailableViews } from "~/hooks/connection";
import { ViewPage } from "~/types";
import AuthenticationView from "./views/authentication/AuthenticationView";
import DashboardView from "./views/dashboard/DashboardView";
import DesignerView from "./views/designer/DesignerView";
import DocumentationView from "./views/documentation/DocumentationView";
import ExplorerView from "./views/explorer/ExplorerView";
import FunctionsView from "./views/functions/FunctionsView";
import GraphqlView from "./views/graphql/GraphqlView";
import MigrationView from "./views/migration/MigrationView";
import MonitorView from "./views/monitor/MonitorView";
import ParametersView from "./views/parameters/ParametersView";
import QueryView from "./views/query/QueryView";

const PORTAL_OPTIONS = {
	attributes: {
		style: "height: 100%; display: flex; flex-direction: column;",
	},
};

const VIEW_PORTALS: Record<ViewPage, HtmlPortalNode> = {
	dashboard: createHtmlPortalNode(PORTAL_OPTIONS),
	monitor: createHtmlPortalNode(PORTAL_OPTIONS),
	query: createHtmlPortalNode(PORTAL_OPTIONS),
	explorer: createHtmlPortalNode(PORTAL_OPTIONS),
	graphql: createHtmlPortalNode(PORTAL_OPTIONS),
	designer: createHtmlPortalNode(PORTAL_OPTIONS),
	authentication: createHtmlPortalNode(PORTAL_OPTIONS),
	functions: createHtmlPortalNode(PORTAL_OPTIONS),
	parameters: createHtmlPortalNode(PORTAL_OPTIONS),
	documentation: createHtmlPortalNode(PORTAL_OPTIONS),
	migrations: createHtmlPortalNode(PORTAL_OPTIONS),
};

const VIEW_COMPONENTS: Record<ViewPage, FC> = {
	dashboard: memo(DashboardView),
	monitor: memo(MonitorView),
	query: memo(QueryView),
	explorer: memo(ExplorerView),
	graphql: memo(GraphqlView),
	designer: memo(DesignerView),
	authentication: memo(AuthenticationView),
	functions: memo(FunctionsView),
	parameters: memo(ParametersView),
	documentation: memo(DocumentationView),
	migrations: memo(MigrationView),
};

export interface ConnectionPageProps {
	view: ViewPage;
}

export function ConnectionPage({ view }: ConnectionPageProps) {
	const views = useAvailableViews();

	const portal = views[view] ? VIEW_PORTALS[view] : undefined;

	return (
		<>
			{Object.values(views).map((mode) => {
				const Content = VIEW_COMPONENTS[mode.id];

				return (
					<InPortal
						key={mode.id}
						node={VIEW_PORTALS[mode.id]}
					>
						<Suspense fallback={null}>
							<Content />
						</Suspense>
					</InPortal>
				);
			})}

			{portal ? (
				<Stack
					flex={1}
					gap={0}
				>
					<OutPortal node={portal} />
				</Stack>
			) : (
				<Redirect to="/overview" />
			)}
		</>
	);
}
