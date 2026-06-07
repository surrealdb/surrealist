import type { BreadcrumbItem } from "~/types";

export function loadingCrumb(): BreadcrumbItem {
	return { label: "Loading..." };
}

export const ORG_TAB_LABELS: Record<string, string> = {
	overview: "Overview",
	instances: "Instances",
	contexts: "Contexts",
	team: "Team",
	invoices: "Invoices",
	billing: "Billing",
	support: "Support",
	usage: "Usage",
	settings: "Settings",
};

export function orgCrumb(org: { id: string; name: string }): BreadcrumbItem {
	return {
		label: org.name,
		href: `/o/${org.id}`,
		selectable: true,
	};
}

export function orgTabCrumb(orgId: string, tab: string, current = false): BreadcrumbItem {
	const label = ORG_TAB_LABELS[tab] ?? tab;

	return {
		label,
		href: current ? undefined : `/o/${orgId}/${tab}`,
	};
}

export function orgPageBreadcrumbs(
	org: { id: string; name: string },
	tab: string,
): BreadcrumbItem[] {
	return [orgCrumb(org), orgTabCrumb(org.id, tab, true)];
}

export function orgSectionBreadcrumbs(
	org: { id: string; name: string },
	section: string,
	...trail: BreadcrumbItem[]
): BreadcrumbItem[] {
	return [
		orgCrumb(org),
		{ label: ORG_TAB_LABELS[section] ?? section, href: `/o/${org.id}/${section}` },
		...trail,
	];
}

export function supportBreadcrumbs(...trail: BreadcrumbItem[]): BreadcrumbItem[] {
	return [{ label: "Support", href: "/support" }, ...trail];
}
