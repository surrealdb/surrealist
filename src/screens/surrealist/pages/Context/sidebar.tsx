import { iconCog } from "@surrealdb/ui";
import { useMemo } from "react";
import { hasOrganizationRoles, ORG_ROLES_ADMIN } from "~/cloud/helpers";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { CONTEXT_SETTINGS_TAB_LABELS, CONTEXT_VIEW_PAGES } from "~/constants";
import type { ContextSettingsTab, ContextViewPage } from "~/types";
import {
	type SidebarEntry,
	SidebarNavigation,
	SidebarPortal,
	type SidebarSubLink,
	useSidebar,
} from "../../sidebar/portal";

export interface ContextSidebarProps {
	contextId: string;
	organizationId: string;
}

/** Workspace pages available to every principal in the context. */
const WORKSPACE_PAGES: ContextViewPage[] = [
	"dashboard",
	"playground",
	"memory",
	"documents",
	"scopes",
	"api-keys",
	"integration",
];

/** Admin-only settings sub-pages, grouped under a single "Settings" entry. */
const SETTINGS_TABS: ContextSettingsTab[] = [
	"general",
	"users",
	"service-accounts",
	"configuration",
	"usage",
];

export function ContextSidebar({ contextId, organizationId }: ContextSidebarProps) {
	const { setLocation } = useSidebar();
	const { data: organization } = useCloudOrganizationQuery(organizationId);

	const isAdmin = organization ? hasOrganizationRoles(organization, ORG_ROLES_ADMIN) : false;

	const navigation: SidebarEntry[][] = useMemo(() => {
		const base = `/s/${organizationId}/${contextId}`;

		const link = (id: ContextViewPage): SidebarEntry => {
			const info = CONTEXT_VIEW_PAGES[id];

			return {
				name: info.name,
				icon: info.icon,
				match: [`${base}/${info.id}`],
				onClick: () => setLocation(`${base}/${info.id}`),
			};
		};

		const workspaceGroup = WORKSPACE_PAGES.map(link);

		const settingsSubLink = (tab: ContextSettingsTab): SidebarSubLink => ({
			name: CONTEXT_SETTINGS_TAB_LABELS[tab],
			match: [`${base}/settings/${tab}`],
			onClick: () => setLocation(`${base}/settings/${tab}`),
		});

		const settingsGroup: SidebarEntry[] = isAdmin
			? [
					{
						name: "Settings",
						icon: iconCog,
						items: SETTINGS_TABS.map(settingsSubLink),
					},
				]
			: [];

		return [workspaceGroup, settingsGroup].filter((group) => group.length > 0);
	}, [contextId, organizationId, isAdmin, setLocation]);

	const backPath = organizationId ? `/o/${organizationId}/overview` : "/overview";

	return (
		<SidebarPortal>
			<SidebarNavigation
				items={navigation}
				backButton={{
					name: "Back",
					onClick: () => setLocation(backPath),
				}}
			/>
		</SidebarPortal>
	);
}
