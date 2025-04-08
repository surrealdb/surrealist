import { useMemo } from "react";
import { useCloudStore } from "~/stores/cloud";
import { Selectable } from "~/types";

/**
 * Use available organizations for selection
 */
export function useOrganizationSelection(): Selectable[] {
	const list = useCloudStore((s) => s.organizations);

	return useMemo(() => {
		return list
			.filter((org) => !!org.archived_at)
			.map((org) => ({
				value: org.id,
				label: org.name,
			}));
	}, [list]);
}
