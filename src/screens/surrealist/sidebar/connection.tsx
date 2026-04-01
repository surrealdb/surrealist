import { useMemo } from "react";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useAvailableViews, useConnection } from "~/hooks/connection";
import { useConnectionAndView, useConnectionNavigator } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import type { ViewPage } from "~/types";
import { type NavigationItem, SidebarNavigation, SidebarPortal, useSidebar } from "./portal";

const VIEW_NAVIGATION: ViewPage[][] = [
	["dashboard", "monitor", "migrations"],
	["query", "explorer", "graphql"],
	["designer", "authentication", "parameters", "functions"],
	["documentation"],
];

export function ConnectionSidebar() {
	const { setLocation, onHoverClose } = useSidebar();
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();
	const sidebarViews = useConfigStore((s) => s.settings.appearance.sidebarViews);
	const views = useAvailableViews();

	const instanceId = useConnection((s) => s?.authentication.cloudInstance);
	const instanceQuery = useCloudInstanceQuery(instanceId);

	const navigation: NavigationItem[][] = useMemo(() => {
		if (!connection) {
			return [];
		}

		return VIEW_NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = views[id];

				if (!info || sidebarViews[id] === false) {
					return [];
				}

				return {
					id: info.id,
					name: info.name,
					icon: info.icon,
					match: [`/c/*/${info.id}`],
					disabled: !connection,
					navigate: () => {
						onHoverClose();
						navigateConnection(connection, info.id);
					},
				};
			});

			return items.length > 0 ? [items] : [];
		});
	}, [views, sidebarViews, connection, onHoverClose]);

	const backButton = instanceId
		? {
				name: "Organization" as const,
				onClick: () => setLocation(`/o/${instanceQuery.data?.organization_id}`),
			}
		: {
				name: "Overview" as const,
				onClick: () => setLocation("/overview"),
			};

	return (
		<SidebarPortal>
			<SidebarNavigation
				items={navigation}
				backButton={backButton}
			/>
		</SidebarPortal>
	);
}
