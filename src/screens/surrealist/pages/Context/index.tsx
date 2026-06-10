import { Center, Loader, Skeleton } from "@mantine/core";
import { type ComponentType, lazy, memo, Suspense } from "react";
import { Redirect } from "wouter";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudContextQuery } from "~/cloud/queries/contexts";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { CloudGuard } from "~/components/CloudGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { CONTEXT_SETTINGS_TAB_LABELS } from "~/constants";
import { useContextAndView, useContextSettingsTab } from "~/hooks/routing";
import type { ContextViewPage } from "~/types";
import { loadingCrumb, orgCrumb } from "~/util/breadcrumbs";
import { PageContainer } from "../../components/PageContainer";
import { SpectronProvider } from "./provider";
import { ContextSidebar } from "./sidebar";
import type { ContextSettingsViewProps, ContextViewProps } from "./types";

function isContextViewPage(view: string): view is ContextViewPage {
	return (
		view === "dashboard" ||
		view === "playground" ||
		view === "memory" ||
		view === "documents" ||
		view === "scopes" ||
		view === "integration" ||
		view === "api-keys" ||
		view === "settings"
	);
}

const DashboardView = lazy(() => import("./views/DashboardView"));
const PlaygroundView = lazy(() => import("./views/PlaygroundView"));
const MemoryView = lazy(() => import("./views/MemoryView"));
const DocumentsView = lazy(() => import("./views/DocumentsView"));
const ScopesView = lazy(() => import("./views/ScopesView"));
const IntegrationView = lazy(() => import("./views/IntegrationView"));
const ApiKeysView = lazy(() => import("./views/ApiKeysView"));
const SettingsView = lazy(() => import("./views/SettingsView"));

type WorkspacePage = Exclude<ContextViewPage, "settings">;

const WORKSPACE_COMPONENTS: Record<WorkspacePage, ComponentType<ContextViewProps>> = {
	dashboard: memo(DashboardView),
	playground: memo(PlaygroundView),
	memory: memo(MemoryView),
	documents: memo(DocumentsView),
	scopes: memo(ScopesView),
	integration: memo(IntegrationView),
	"api-keys": memo(ApiKeysView),
};

const SettingsComponent = memo(SettingsView) as ComponentType<ContextSettingsViewProps>;

export interface ContextPageProps {
	view: string;
}

export function ContextPage({ view }: ContextPageProps) {
	const [organizationId, contextId] = useContextAndView();
	const settingsTab = useContextSettingsTab();

	const contextQuery = useCloudContextQuery(organizationId ?? undefined, contextId ?? undefined);
	const orgQuery = useCloudOrganizationQuery(organizationId ?? undefined);

	const isSuccess = contextQuery.isSuccess;
	const isLoading = contextQuery.isLoading || contextQuery.isPending;
	const isOrgLoading = orgQuery.isLoading || orgQuery.isPending;
	const isAdmin = orgQuery.data ? hasOrganizationRoles(orgQuery.data, ORG_ROLES_ADMIN) : false;

	const base = `/s/${organizationId}/${contextId}`;

	if (isSuccess && !contextQuery.data) {
		return <Redirect to="/overview" />;
	}

	if (organizationId && contextId && !isContextViewPage(view)) {
		return <Redirect to={`${base}/dashboard`} />;
	}

	const viewPage = view as ContextViewPage;

	// Settings is admin-only and always lands on a concrete tab.
	if (viewPage === "settings" && organizationId && contextId) {
		if (orgQuery.isSuccess && !isAdmin) {
			return <Redirect to={`${base}/dashboard`} />;
		}

		if (!settingsTab) {
			return <Redirect to={`${base}/settings/general`} />;
		}
	}

	const Component =
		viewPage === "settings" ? null : WORKSPACE_COMPONENTS[viewPage as WorkspacePage];

	return (
		<>
			<PageBreadcrumbs
				items={[
					isOrgLoading || !orgQuery.data ? loadingCrumb() : orgCrumb(orgQuery.data),
					isLoading || !contextQuery.data
						? loadingCrumb()
						: {
								label: contextQuery.data.name,
								selectable: true,
							},
					...(viewPage === "settings" && settingsTab
						? [{ label: CONTEXT_SETTINGS_TAB_LABELS[settingsTab] }]
						: []),
				]}
			/>
			<CloudGuard>
				<ContextSidebar
					contextId={contextId ?? ""}
					organizationId={organizationId ?? ""}
				/>
				<PageContainer>
					{isLoading && (
						<Skeleton
							width={200}
							h={50}
							mt="sm"
						/>
					)}
					{contextQuery.data && (
						<SpectronProvider
							context={contextQuery.data}
							organizationId={organizationId ?? contextQuery.data.organization_id}
						>
							<Suspense
								fallback={
									<Center flex={1}>
										<Loader />
									</Center>
								}
							>
								{viewPage === "settings" ? (
									<SettingsComponent
										context={contextQuery.data}
										tab={settingsTab ?? "general"}
									/>
								) : Component ? (
									<Component context={contextQuery.data} />
								) : null}
							</Suspense>
						</SpectronProvider>
					)}
				</PageContainer>
			</CloudGuard>
		</>
	);
}
