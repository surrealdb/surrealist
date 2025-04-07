import { useEffect } from "react";
import { OVERVIEW_KEY } from "~/util/storage";

export const OVERVIEW: Savepoint = { path: "/overview", name: "Overview" };
export const ORGANIZATIONS: Savepoint = { path: "/organizations", name: "Organizations" };

export interface Savepoint {
	path: string;
	name: string;
}

/**
 * Store the current path and name in session storage when the component mounts.
 */
export function useSavepoint(savepoint: Savepoint) {
	useEffect(() => {
		sessionStorage.setItem(OVERVIEW_KEY, JSON.stringify(savepoint));
	}, [savepoint]);
}

/**
 * Use the last savepoint from session storage.
 */
export function useLastSavepoint(): Savepoint {
	const overview = sessionStorage.getItem(OVERVIEW_KEY);

	if (overview) {
		return JSON.parse(overview) as Savepoint;
	}

	return OVERVIEW;
}
