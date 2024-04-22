import { TableInfo } from "~/types";
import { DocsArticleTopic } from "./types";

export function getTable(topic: DocsArticleTopic): TableInfo {
	return topic.extra!.table;
}