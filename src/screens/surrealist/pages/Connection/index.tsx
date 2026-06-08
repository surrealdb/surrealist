import { FC, memo, Suspense } from "react";
import { createHtmlPortalNode, HtmlPortalNode, InPortal, OutPortal } from "react-reverse-portal";
import { Redirect } from "wouter";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { useAvailableViews, useConnection } from "~/hooks/connection";
import { ViewPage } from "~/types";
import { orgSectionBreadcrumbs } from "~/util/breadcrumbs";
import { ViewPageProps } from "./types";
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
		style: "flex: 1; display: flex; flex-direction: column;",
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

const VIEW_COMPONENTS: Record<ViewPage, FC<ViewPageProps>> = {
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
	const instanceId = useConnection((c) => c?.authentication.cloudInstance);

	const portal = views[view] ? VIEW_PORTALS[view] : undefined;

	const instanceQuery = useCloudInstanceQuery(instanceId);
	const organisationQuery = useCloudOrganizationQuery(instanceQuery.data?.organization_id);

	const breadcrumb = {
		id: organisationQuery.data?.id ?? "",
		name: organisationQuery.data?.name ?? "",
	};

	return (
		<>
			<PageBreadcrumbs items={orgSectionBreadcrumbs(breadcrumb, "instances")} />

			{Object.values(views).map((mode) => {
				const Content = VIEW_COMPONENTS[mode.id];

				return (
					<InPortal
						key={mode.id}
						node={VIEW_PORTALS[mode.id]}
					>
						<Suspense fallback={null}>
							<Content
								instanceQuery={instanceQuery}
								organisationQuery={organisationQuery}
							/>
						</Suspense>
					</InPortal>
				);
			})}

			{portal ? <OutPortal node={portal} /> : <Redirect to="/" />}
		</>
	);
}
