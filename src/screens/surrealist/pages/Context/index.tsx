import { Center, Loader, Skeleton } from "@mantine/core";
import { lazy, memo, Suspense } from "react";
import { Redirect } from "wouter";
import { useCloudContextQuery } from "~/cloud/queries/contexts";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { CloudGuard } from "~/components/CloudGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { useContextAndView } from "~/hooks/routing";
import type { ContextViewPage } from "~/types";
import { loadingCrumb, orgCrumb } from "~/util/breadcrumbs";
import { PageContainer } from "../../components/PageContainer";
import { ContextSidebar } from "./sidebar";
import type { ContextViewProps } from "./types";

function isContextViewPage(view: string): view is ContextViewPage {
	return (
		view === "dashboard" ||
		view === "playground" ||
		view === "memories" ||
		view === "knowledge" ||
		view === "integration" ||
		view === "api-keys" ||
		view === "settings"
	);
}

const DashboardView = lazy(() => import("./views/DashboardView"));
const PlaygroundView = lazy(() => import("./views/PlaygroundView"));
const MemoriesView = lazy(() => import("./views/MemoriesView"));
const KnowledgeView = lazy(() => import("./views/KnowledgeView"));
const ApiKeysView = lazy(() => import("./views/ApiKeysView"));
const IntegrationView = lazy(() => import("./views/IntegrationView"));
const SettingsView = lazy(() => import("./views/SettingsView"));

const VIEW_COMPONENTS: Record<ContextViewPage, React.ComponentType<ContextViewProps>> = {
	dashboard: memo(DashboardView),
	playground: memo(PlaygroundView),
	memories: memo(MemoriesView),
	knowledge: memo(KnowledgeView),
	integration: memo(IntegrationView),
	"api-keys": memo(ApiKeysView),
	settings: memo(SettingsView),
};

export interface ContextPageProps {
	view: string;
}

export function ContextPage({ view }: ContextPageProps) {
	const [organizationId, contextId] = useContextAndView();

	const contextQuery = useCloudContextQuery(organizationId ?? undefined, contextId ?? undefined);
	const orgQuery = useCloudOrganizationQuery(organizationId ?? undefined);

	const isSuccess = contextQuery.isSuccess;
	const isLoading = contextQuery.isLoading || contextQuery.isPending;
	const isOrgLoading = orgQuery.isLoading || orgQuery.isPending;

	if (isSuccess && !contextQuery.data) {
		return <Redirect to="/" />;
	}

	if (organizationId && contextId && !isContextViewPage(view)) {
		return <Redirect to={`/s/${organizationId}/${contextId}/dashboard`} />;
	}

	const viewPage = view as ContextViewPage;
	const Component = VIEW_COMPONENTS[viewPage];

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
						<Suspense
							fallback={
								<Center flex={1}>
									<Loader />
								</Center>
							}
						>
							<Component context={contextQuery.data} />
						</Suspense>
					)}
				</PageContainer>
			</CloudGuard>
		</>
	);
}
