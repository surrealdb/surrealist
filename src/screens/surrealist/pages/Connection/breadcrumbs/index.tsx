import { useMemo } from "react";
import { usePageBreadcrumbs, useToolbarInset } from "~/hooks/breadcrumbs";
import { useConnectionType, useIsConnected } from "~/hooks/connection";
import type { BreadcrumbItem, CloudOrganization } from "~/types";
import { orgSectionBreadcrumbs } from "~/util/breadcrumbs";
import { ConnectionToolbarActions } from "./actions";
import { ConnectionCrumb } from "./connection";
import { DatabaseCrumb } from "./database";

export interface ConnectionBreadcrumbsProps {
	organisation: CloudOrganization | undefined;
}

/**
 * Registers connection page breadcrumbs and toolbar actions for the current view.
 */
export function ConnectionBreadcrumbs({ organisation }: ConnectionBreadcrumbsProps) {
	const isConnected = useIsConnected();
	const type = useConnectionType();

	const items = useMemo(() => {
		const trail: BreadcrumbItem[] = [];

		// Prefix path
		if (type === "cloud") {
			const options = {
				id: organisation?.id ?? "",
				name: organisation?.name ?? "",
			};

			trail.push(...orgSectionBreadcrumbs(options, "instances"));
		} else {
			trail.push({
				label: "Connections",
			});
		}

		// Connection
		trail.push({
			label: "Connection",
			content: <ConnectionCrumb />,
		});

		// Database
		if (type !== "sandbox" && isConnected) {
			trail.push({
				label: "Database",
				content: <DatabaseCrumb />,
			});
		}

		return trail;
	}, [organisation, type, isConnected]);

	const toolbarInset = useMemo(() => <ConnectionToolbarActions />, []);

	usePageBreadcrumbs(items);
	useToolbarInset(toolbarInset);

	return null;
}
