import { Box, Center, Loader, ScrollArea, Skeleton, Stack } from "@mantine/core";
import { lazy, memo, Suspense } from "react";
import { Redirect } from "wouter";
import { useCloudContextQuery } from "~/cloud/queries/contexts";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { useContextAndView } from "~/hooks/routing";
import type { ContextViewPage } from "~/types";
import { ContextSidebar } from "./sidebar";
import classes from "./style.module.scss";
import { ContextViewProps } from "./types";

const DashboardView = lazy(() => import("./views/DashboardView"));
const MemoriesView = lazy(() => import("./views/MemoriesView"));
const KnowledgeView = lazy(() => import("./views/KnowledgeView"));
const ApiKeysView = lazy(() => import("./views/ApiKeysView"));
const SettingsView = lazy(() => import("./views/SettingsView"));

const VIEW_COMPONENTS: Record<ContextViewPage, React.ComponentType<ContextViewProps>> = {
	dashboard: memo(DashboardView),
	memories: memo(MemoriesView),
	knowledge: memo(KnowledgeView),
	"api-keys": memo(ApiKeysView),
	settings: memo(SettingsView),
};

export interface ContextPageProps {
	view: string;
}

export function ContextPage({ view }: ContextPageProps) {
	const [contextId] = useContextAndView();

	const contextQuery = useCloudContextQuery(contextId ?? undefined);
	const organizationQuery = useCloudOrganizationQuery(contextQuery.data?.organization_id);

	const viewPage = view as ContextViewPage;
	const Component = VIEW_COMPONENTS[viewPage];

	const isSuccess = contextQuery.isSuccess && organizationQuery.isSuccess;
	const isLoading =
		contextQuery.isLoading ||
		contextQuery.isPending ||
		organizationQuery.isLoading ||
		organizationQuery.isPending;

	if (isSuccess && !contextQuery.data) {
		return <Redirect to="/overview" />;
	}

	return (
		<>
			<ContextSidebar
				contextId={contextId ?? ""}
				organizationId={contextQuery.data?.organization_id}
			/>
			<Box
				flex={1}
				pos="relative"
			>
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					mt={18}
				>
					<Stack
						px="xl"
						mx="auto"
						maw={1200}
						pb={68}
					>
						{isLoading ? (
							<Skeleton
								width={350}
								h={12}
							/>
						) : (
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{
										label: organizationQuery.data?.name ?? "",
										href: `/o/${contextQuery.data?.organization_id}`,
									},
									{ label: contextQuery.data?.name ?? "" },
								]}
							/>
						)}
						{isLoading && (
							<Skeleton
								width={200}
								h={50}
								mt="sm"
							/>
						)}
						{contextQuery.data && organizationQuery.data && (
							<Suspense
								fallback={
									<Center flex={1}>
										<Loader />
									</Center>
								}
							>
								<Component
									context={contextQuery.data}
									organization={organizationQuery.data}
								/>
							</Suspense>
						)}
					</Stack>
				</ScrollArea>
			</Box>
		</>
	);
}
