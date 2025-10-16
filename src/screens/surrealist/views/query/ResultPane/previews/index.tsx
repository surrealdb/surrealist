import { tryit } from "radash";
import type { Formatter } from "~/hooks/surrealql";
import type { QueryTab } from "~/types";

export interface PreviewProps {
	responses: any[];
	selected: number;
	query: QueryTab;
	isLive: boolean;
}

export async function attemptFormat(format: Formatter, data: any): Promise<string> {
	const [err, res] = await tryit(format)(data);

	return err ? `"Error: ${err.message}"` : res;
}
