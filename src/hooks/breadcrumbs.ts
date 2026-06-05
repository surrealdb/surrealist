import { useLayoutEffect } from "react";
import { useInterfaceStore } from "~/stores/interface";
import type { BreadcrumbItem } from "~/types";

/**
 * Register page breadcrumbs in the toolbar for the current view.
 */
export function usePageBreadcrumbs(items: BreadcrumbItem[]) {
	const setPageBreadcrumbs = useInterfaceStore((s) => s.setPageBreadcrumbs);

	useLayoutEffect(() => {
		setPageBreadcrumbs(items);

		return () => {
			setPageBreadcrumbs([]);
		};
	}, [items, setPageBreadcrumbs]);
}
