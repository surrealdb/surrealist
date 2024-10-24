import { tryit } from "radash";
import type { Formatter } from "~/hooks/surrealql";
import type { TabQuery } from "~/types";

export interface PreviewProps {
	responses: any[];
	selected: number;
	query: TabQuery;
	isLive: boolean;
}

export function attemptFormat(format: Formatter, data: any) {
	const [err, res] = tryit(format)(data);

	return err ? `"Error: ${err.message}"` : res;
}
