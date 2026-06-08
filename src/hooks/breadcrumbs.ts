import type { ReactNode } from "react";
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

/**
 * Register supplementary toolbar content shown after the breadcrumb trail.
 */
export function useToolbarInset(inset: ReactNode) {
	const setToolbarInset = useInterfaceStore((s) => s.setToolbarInset);

	useLayoutEffect(() => {
		setToolbarInset(inset);

		return () => {
			setToolbarInset(null);
		};
	}, [inset, setToolbarInset]);
}
