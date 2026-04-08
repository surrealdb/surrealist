import { useMemo } from "react";
import { CONTEXT_VIEW_PAGES } from "~/constants";
import type { ContextViewPage } from "~/types";
import {
	type NavigationItem,
	SidebarNavigation,
	SidebarPortal,
	useSidebar,
} from "../../sidebar/portal";

const VIEW_NAVIGATION: ContextViewPage[][] = [
	["dashboard"],
	["memories", "entities", "knowledge"],
	["api-keys", "settings"],
];

export interface ContextSidebarProps {
	contextId: string;
	organizationId?: string;
}

export function ContextSidebar({ contextId, organizationId }: ContextSidebarProps) {
	const { setLocation } = useSidebar();

	const navigation: NavigationItem[][] = useMemo(() => {
		const base = `/x/${contextId}`;

		return VIEW_NAVIGATION.map((group) =>
			group.map((id) => {
				const info = CONTEXT_VIEW_PAGES[id];

				return {
					name: info.name,
					icon: info.icon,
					match: [`${base}/${info.id}`],
					navigate: () => setLocation(`${base}/${info.id}`),
				};
			}),
		);
	}, [contextId, setLocation]);

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
