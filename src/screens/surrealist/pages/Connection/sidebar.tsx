import { iconTune } from "@surrealdb/ui";
import { useMemo } from "react";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { CONNECTION_SETTINGS_TAB_LABELS } from "~/constants";
import { useAvailableViews, useConnection } from "~/hooks/connection";
import { useConnectionFromRoute, useConnectionNavigator } from "~/hooks/routing";
import { useConfigStore } from "~/stores/config";
import type { ConnectionSettingsTab, ViewPage } from "~/types";
import { connectionSettingsPath } from "~/util/connection-settings";
import { optional } from "~/util/helpers";
import {
	type SidebarEntry,
	SidebarNavigation,
	SidebarPortal,
	type SidebarSubLink,
	useSidebar,
} from "../../sidebar/portal";

const VIEW_NAVIGATION: ViewPage[][] = [
	["dashboard", "monitor", "migrations", "documentation"],
	["query", "explorer", "graphql"],
	["designer", "authentication", "parameters", "functions"],
];

const ALWAYS_SETTINGS_TABS: ConnectionSettingsTab[] = ["general", "databases", "import-export"];

const ADMIN_CLOUD_SETTINGS_TABS: ConnectionSettingsTab[] = [
	"configuration",
	"compute",
	"lifecycle",
];

export function ConnectionSidebar() {
	const { setLocation } = useSidebar();
	const connection = useConnectionFromRoute();
	const navigateConnection = useConnectionNavigator();
	const sidebarViews = useConfigStore((s) => s.settings.appearance.sidebarViews);
	const views = useAvailableViews();

	const isCloud = useConnection((s) => s?.authentication.mode === "cloud");
	const instanceId = useConnection((s) => s?.authentication.cloudInstance);
	const instanceQuery = useCloudInstanceQuery(instanceId);
	const organisationQuery = useCloudOrganizationQuery(instanceQuery.data?.organization_id);

	const organisation = organisationQuery.data;
	const isAdmin = organisation ? hasOrganizationRoles(organisation, ORG_ROLES_ADMIN) : false;

	const navigation: SidebarEntry[][] = useMemo(() => {
		if (!connection) {
			return [];
		}

		const viewGroups = VIEW_NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = views[id];

				if (!info || sidebarViews[id] === false) {
					return [];
				}

				return {
					name: info.name,
					icon: info.icon,
					match: [`/c/*/${info.id}`],
					disabled: !connection,
					onClick: () => {
						navigateConnection(connection, info.id);
					},
				};
			});

			return items.length > 0 ? [items] : [];
		});

		const settingsTabs = [
			...ALWAYS_SETTINGS_TABS,
			...optional(isCloud && isAdmin && ADMIN_CLOUD_SETTINGS_TABS),
			...optional(isCloud && "backups"),
		];

		const subLink = (tab: ConnectionSettingsTab): SidebarSubLink => ({
			name: CONNECTION_SETTINGS_TAB_LABELS[tab],
			match: [`/c/${connection}/settings/${tab}`],
			onClick: () => setLocation(connectionSettingsPath(connection, tab)),
		});

		const settingsGroup: SidebarEntry[] = [
			{
				name: "Settings",
				icon: iconTune,
				items: settingsTabs.map(subLink),
			},
		];

		return [...viewGroups, settingsGroup];
	}, [views, sidebarViews, connection, isCloud, isAdmin, setLocation]);

	const backButton = instanceId
		? {
				name: "Organization" as const,
				onClick: () => setLocation(`/o/${instanceQuery.data?.organization_id}`),
			}
		: {
				name: "Overview" as const,
				onClick: () => setLocation("/"),
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
