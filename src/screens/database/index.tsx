import { Screen } from "~/components/Screen";
import { DatabaseSidebar } from "./sidebar";
import { DatabaseToolbar } from "./toolbar";
import { HtmlPortalNode, InPortal, OutPortal, createHtmlPortalNode } from "react-reverse-portal";
import { ViewMode } from "~/types";
import { Suspense, lazy } from "react";
import { useConfigStore } from "~/stores/config";

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
	functions: createHtmlPortalNode(PORTAL_ATTRS),
	models: createHtmlPortalNode(PORTAL_ATTRS),
	documentation: createHtmlPortalNode(PORTAL_ATTRS),
};

const QueryView = lazy(() => import('./views/query/QueryView'));
const ExplorerView = lazy(() => import('./views/explorer/ExplorerView'));
const DesignerView = lazy(() => import('./views/designer/DesignerView'));
const AuthenticationView = lazy(() => import('./views/authentication/AuthenticationView'));
const FunctionsView = lazy(() => import('./views/functions/FunctionsView'));
const ModelsView = lazy(() => import('./views/models/ModelsView'));
const DocumentationView = lazy(() => import('./views/documentation/DocumentationView'));

export function DatabaseScreen() {
	const viewMode = useConfigStore(s => s.activeView);
	const viewNode = VIEW_PORTALS[viewMode];

	return (
		<Screen
			sidebar={
				(state) => (
					<DatabaseSidebar
						state={state}
					/>
				)
			}
			toolbar={
				(state) => (
					<DatabaseToolbar
						state={state}
					/>
				)
			}
		>
			{viewNode && <OutPortal node={viewNode} />}

			<InPortal node={VIEW_PORTALS.query}>
				<Suspense fallback={null}>
					<QueryView />
				</Suspense>
			</InPortal>

			<InPortal node={VIEW_PORTALS.explorer}>
				<Suspense fallback={null}>
					<ExplorerView />
				</Suspense>
			</InPortal>

			<InPortal node={VIEW_PORTALS.designer}>
				<Suspense fallback={null}>
					<DesignerView />
				</Suspense>
			</InPortal>

			<InPortal node={VIEW_PORTALS.authentication}>
				<Suspense fallback={null}>
					<AuthenticationView />
				</Suspense>
			</InPortal>

			<InPortal node={VIEW_PORTALS.functions}>
				<Suspense fallback={null}>
					<FunctionsView />
				</Suspense>
			</InPortal>

			<InPortal node={VIEW_PORTALS.models}>
				<Suspense fallback={null}>
					<ModelsView />
				</Suspense>
			</InPortal>

			<InPortal node={VIEW_PORTALS.documentation}>
				<Suspense fallback={null}>
					<DocumentationView />
				</Suspense>
			</InPortal>
		</Screen>
	);
}