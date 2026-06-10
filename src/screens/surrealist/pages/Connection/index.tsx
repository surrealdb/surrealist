import { FC, memo, Suspense } from "react";
import { createHtmlPortalNode, HtmlPortalNode, InPortal, OutPortal } from "react-reverse-portal";
import { Redirect } from "wouter";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { CONNECTION_SETTINGS_TABS } from "~/constants";
import { useAvailableViews, useConnection } from "~/hooks/connection";
import { useConnectionFromRoute } from "~/hooks/routing";
import type { ConnectionSettingsTab, ViewPage } from "~/types";
import { getConnectionById } from "~/util/connection";
import { PageContainer } from "../../components/PageContainer";
import { ConnectionBreadcrumbs } from "./breadcrumbs";
import { connectionSettingsRedirect, resolveConnectionSettingsTab } from "./settings/helpers";
import { ConnectionBackupsTab } from "./settings/tabs/backups";
import { ConnectionCapabilitiesTab } from "./settings/tabs/capabilities";
import { ConnectionComputeTab } from "./settings/tabs/compute";
import { ConnectionDatabasesTab } from "./settings/tabs/databases";
import { ConnectionGeneralTab } from "./settings/tabs/general";
import { ConnectionImportExportTab } from "./settings/tabs/import-export";
import { ConnectionVersionTab } from "./settings/tabs/version";
import { ConnectionSettingsTabProps } from "./settings/types";
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

const SETTINGS_PORTALS: Record<ConnectionSettingsTab, HtmlPortalNode> = {
	general: createHtmlPortalNode(PORTAL_OPTIONS),
	databases: createHtmlPortalNode(PORTAL_OPTIONS),
	"import-export": createHtmlPortalNode(PORTAL_OPTIONS),
	capabilities: createHtmlPortalNode(PORTAL_OPTIONS),
	version: createHtmlPortalNode(PORTAL_OPTIONS),
	compute: createHtmlPortalNode(PORTAL_OPTIONS),
	backups: createHtmlPortalNode(PORTAL_OPTIONS),
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

const SETTINGS_COMPONENTS: Record<ConnectionSettingsTab, FC<ConnectionSettingsTabProps>> = {
	general: memo(ConnectionGeneralTab),
	databases: memo(ConnectionDatabasesTab),
	"import-export": memo(ConnectionImportExportTab),
	capabilities: memo(ConnectionCapabilitiesTab),
	version: memo(ConnectionVersionTab),
	compute: memo(ConnectionComputeTab),
	backups: memo(ConnectionBackupsTab),
};

export interface ConnectionPageProps {
	view?: ViewPage;
	settingsTab?: string;
}

function SettingsTabPortal({
	tab,
	instanceQuery,
	organisationQuery,
}: ViewPageProps & { tab: ConnectionSettingsTab }) {
	const connectionId = useConnectionFromRoute();
	const connection = connectionId ? getConnectionById(connectionId) : undefined;

	if (!connection) {
		return null;
	}

	const Content = SETTINGS_COMPONENTS[tab];

	return (
		<PageContainer>
			<Content
				connection={connection}
				instanceQuery={instanceQuery}
				organisationQuery={organisationQuery}
			/>
		</PageContainer>
	);
}

export function ConnectionPage({ view, settingsTab }: ConnectionPageProps) {
	const connectionId = useConnectionFromRoute();
	const views = useAvailableViews();
	const isCloud = useConnection((c) => c?.authentication.mode === "cloud");
	const instanceId = useConnection((c) => c?.authentication.cloudInstance);

	const instanceQuery = useCloudInstanceQuery(instanceId);
	const organisationQuery = useCloudOrganizationQuery(instanceQuery.data?.organization_id);

	const organisation = organisationQuery.data;
	const isAdmin = organisation ? hasOrganizationRoles(organisation, ORG_ROLES_ADMIN) : false;

	const instance = instanceQuery.data;
	const resolvedSettingsTab =
		settingsTab && connectionId
			? resolveConnectionSettingsTab(
					connectionId,
					settingsTab,
					isCloud,
					isAdmin,
					instance,
					organisation,
				)
			: null;

	const viewPortal = view && views[view] ? VIEW_PORTALS[view] : undefined;
	const settingsPortal = resolvedSettingsTab ? SETTINGS_PORTALS[resolvedSettingsTab] : undefined;

	const sharedQueryProps = {
		instanceQuery,
		organisationQuery,
	};

	if (!connectionId || !getConnectionById(connectionId)) {
		return <Redirect to="/" />;
	}

	if (settingsTab && resolvedSettingsTab === null) {
		return <Redirect to={connectionSettingsRedirect(connectionId)} />;
	}

	if (!settingsTab && view && !views[view]) {
		return <Redirect to="/" />;
	}

	return (
		<>
			<ConnectionBreadcrumbs organisation={organisationQuery.data} />

			{Object.values(views).map((mode) => {
				const Content = VIEW_COMPONENTS[mode.id];

				return (
					<InPortal
						key={mode.id}
						node={VIEW_PORTALS[mode.id]}
					>
						<Suspense fallback={null}>
							<Content {...sharedQueryProps} />
						</Suspense>
					</InPortal>
				);
			})}

			{CONNECTION_SETTINGS_TABS.map((tab) => (
				<InPortal
					key={tab}
					node={SETTINGS_PORTALS[tab]}
				>
					<Suspense fallback={null}>
						<SettingsTabPortal
							tab={tab}
							{...sharedQueryProps}
						/>
					</Suspense>
				</InPortal>
			))}

			{settingsPortal ? (
				<OutPortal node={settingsPortal} />
			) : viewPortal ? (
				<OutPortal node={viewPortal} />
			) : (
				<Redirect to="/" />
			)}
		</>
	);
}
