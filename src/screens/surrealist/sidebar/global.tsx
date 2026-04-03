import { useMemo } from "react";
import { useAvailablePages } from "~/hooks/connection";
import type { GlobalPage } from "~/types";
import { type NavigationItem, SidebarNavigation, SidebarPortal, useSidebar } from "./portal";

const GLOBAL_NAVIGATION: GlobalPage[][] = [["/overview"], ["/referrals"], ["/mini/new"]];

export function GlobalSidebar() {
	const { setLocation } = useSidebar();
	const pages = useAvailablePages();

	const navigation: NavigationItem[][] = useMemo(() => {
		return GLOBAL_NAVIGATION.flatMap((row) => {
			const items = row.flatMap((id) => {
				const info = pages[id];

				if (!info) {
					return [];
				}

				return {
					id: info.id,
					name: info.name,
					icon: info.icon,
					match: [info.id, ...(info.aliases || [])],
					navigate: () => setLocation(info.id),
				};
			});

			return items.length > 0 ? [items] : [];
		});
	}, [pages, setLocation]);

	return (
		<SidebarPortal>
			<SidebarNavigation items={navigation} />
		</SidebarPortal>
	);
}
