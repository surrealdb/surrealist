import type { TableInfo } from "~/types";
import type { DocsArticleTopic } from "./types";

export function getTable(topic: DocsArticleTopic): TableInfo {
	if (topic.extra?.table) {
		return topic.extra.table;
	}

	throw new Error("No table found in topic");
}
