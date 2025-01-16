import { NodeDisplayData, EdgeDisplayData } from "sigma/types";
import { RecordId } from "surrealdb";

export interface RelationGraphNode extends Partial<NodeDisplayData> {
	record: RecordId;
}

export interface RelationGraphEdge extends Partial<EdgeDisplayData> {
	record: RecordId;
	weight: number;
}

export interface GraphExpansion {
	record: RecordId;
	direction: "<-" | "->";
	edge: string;
}
