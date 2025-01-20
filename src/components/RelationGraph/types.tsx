import { MultiDirectedGraph } from "graphology";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { RecordId } from "surrealdb";

export type RelationalGraph = MultiDirectedGraph<RelationGraphNode, RelationGraphEdge>;

export interface RelationGraphNode extends Partial<NodeDisplayData> {
	record: RecordId;
}

export interface RelationGraphEdge extends Partial<EdgeDisplayData> {
	record: RecordId;
	weight: number;
	curvature?: number;
	parallelIndex?: number;
	parallelMinIndex?: number;
	parallelMaxIndex?: number;
}

export interface GraphEdges {
	from: Set<string>;
	to: Set<string>;
}

export interface GraphExpansion {
	record: RecordId;
	direction: "<-" | "->" | "<->";
	edges: string[];
}
