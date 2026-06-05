import { iconBook } from "@surrealdb/ui";
import { useMemo } from "react";
import { CONTEXT_VIEW_PAGES } from "~/constants";
import type { ContextViewPage } from "~/types";
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

export function ContextSidebar({ contextId, organizationId }: ContextSidebarProps) {
	const { setLocation } = useSidebar();

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

		const subLink = (id: ContextViewPage): SidebarSubLink => {
			const info = CONTEXT_VIEW_PAGES[id];

			return {
				name: info.name,
				match: [`${base}/${info.id}`],
				onClick: () => setLocation(`${base}/${info.id}`),
			};
		};

		return [
			[link("dashboard"), link("integration")],
			[
				link("playground"),
				{
					name: "Knowledge base",
					icon: iconBook,
					items: [subLink("memories"), subLink("knowledge")],
				},
			],
			[link("api-keys"), link("settings")],
		];
	}, [contextId, organizationId, setLocation]);

	const backPath = organizationId ? `/o/${organizationId}/overview` : "/";

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
