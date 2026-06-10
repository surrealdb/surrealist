import { usePageBreadcrumbs } from "~/hooks/breadcrumbs";
import type { BreadcrumbItem } from "~/types";

export interface PageBreadcrumbsProps {
	items: BreadcrumbItem[];
}

/**
 * Registers page breadcrumbs in the toolbar. Renders nothing.
 */
export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
	usePageBreadcrumbs(items);

	return null;
}
