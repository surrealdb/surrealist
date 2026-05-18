import { useMemo } from "react";
import { hasOrganizationRoles } from "~/cloud/helpers";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { CONTEXT_VIEW_PAGES } from "~/constants";
import type { CloudOrganization } from "~/types";
import type { ContextViewPage } from "~/types";
import {
	type SidebarEntry,
	SidebarNavigation,
	SidebarPortal,
	useSidebar,
} from "../../sidebar/portal";

export interface ContextSidebarProps {
	contextId: string;
	organizationId: string;
}

function canAccessPage(organization: CloudOrganization | undefined, id: ContextViewPage) {
	const info = CONTEXT_VIEW_PAGES[id];

	if (info.permissions && !hasOrganizationRoles(organization, info.permissions)) {
		return false;
	}

	return true;
}

export function ContextSidebar({ contextId, organizationId }: ContextSidebarProps) {
	const { setLocation } = useSidebar();
	const { data: organization } = useCloudOrganizationQuery(organizationId);

	const navigation: SidebarEntry[][] = useMemo(() => {
		const base = `/s/${organizationId}/${contextId}`;

		const link = (id: ContextViewPage): SidebarEntry | null => {
			if (!canAccessPage(organization, id)) {
				return null;
			}

			const info = CONTEXT_VIEW_PAGES[id];

			return {
				name: info.name,
				icon: info.icon,
				match: [`${base}/${info.id}`],
				onClick: () => setLocation(`${base}/${info.id}`),
			};
		};

		return [
			[link("dashboard"), link("integration")].filter(
				(item): item is SidebarEntry => item !== null,
			),
			[link("api-keys"), link("settings")].filter(
				(item): item is SidebarEntry => item !== null,
			),
		].filter((group) => group.length > 0);
	}, [contextId, organizationId, organization, setLocation]);

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
