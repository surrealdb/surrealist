import classes from "./style.module.scss";

import {
	type Edge,
	type EdgeChange,
	type EdgeTypes,
	MarkerType,
	type Node,
	type NodeChange,
	type NodeTypes,
} from "@xyflow/react";
import type { ElkEdgeSection } from "elkjs/lib/elk-api";
import { toBlob, toSvg } from "html-to-image";
import { objectify } from "radash";
import type { DiagramDirection, TableInfo } from "~/types";
import { getSetting } from "~/util/config";
import { extractEdgeRecords } from "~/util/schema";
import { extractKindRecords } from "~/util/surrealql";
import { ElkStepEdge } from "./edges/ElkEdge";
import { EdgeNode } from "./nodes/EdgeNode";
import { TableNode } from "./nodes/TableNode";

type EdgeWarning = {
	type: "edge";
	table: string;
	foreign: string;
	direction: "in" | "out";
};

type LinkWarning = {
	type: "link";
	table: string;
	foreign: string;
	field: string;
};

export const NODE_TYPES: NodeTypes = {
	table: TableNode,
	edge: EdgeNode,
};

export const EDGE_TYPES: EdgeTypes = {
	elk: ElkStepEdge,
};

export type InternalNode = Node & { width: number; height: number };
export type GraphWarning = EdgeWarning | LinkWarning;

export type SharedNodeData = {
	table: TableInfo;
	isSelected: boolean;
	hasIncoming: boolean;
	hasOutgoing: boolean;
};

interface NormalizedTable {
	isEdge: boolean;
	table: TableInfo;
	from: string[];
	to: string[];
}

function normalizeTables(tables: TableInfo[]): NormalizedTable[] {
	return tables.map((table) => {
		const [isEdge, from, to] = extractEdgeRecords(table);

		return {
			table,
			isEdge,
			to,
			from,
		};
	});
}

export function buildFlowNodes(
	tables: TableInfo[],
	showLinks: boolean,
): [Node[], Edge[], GraphWarning[]] {
	const lineStyle = getSetting("appearance", "lineStyle");

	const items = normalizeTables(tables);
	const nodeIndex: Record<string, Node> = {};
	const edges: Edge[] = [];
	const nodes: Node[] = [];

	// Base edge options
	const baseEdge: any = {
		deletable: false,
	};

	switch (lineStyle) {
		case "metro": {
			baseEdge.type = "elk";
			baseEdge.pathOptions = { borderRadius: 50 };
			break;
		}
		case "smooth": {
			baseEdge.type = "default";
			break;
		}
		case "straight": {
			baseEdge.type = "straight";
			break;
		}
	}

	// Define all nodes
	for (const { table, isEdge } of items) {
		const name = table.schema.name;
		const node: any = {
			id: name,
			type: isEdge ? "edge" : "table",
			position: { x: 0, y: 0 },
			deletable: false,
			data: {
				table,
				isSelected: false,
				hasIncoming: false,
				hasOutgoing: false,
			},
		};

		nodes.push(node);
		nodeIndex[name] = node;
	}

	const edgeItems = items.filter((item) => item.isEdge);
	const edgeIndex = new Map<string, boolean>();
	const warnings: GraphWarning[] = [];

	// Define all edges
	for (const { table, from, to } of edgeItems) {
		for (const fromTable of from) {
			if (!nodeIndex[fromTable]) {
				warnings.push({
					type: "edge",
					table: table.schema.name,
					foreign: fromTable,
					direction: "in",
				});
				continue;
			}

			edges.push({
				...baseEdge,
				id: `tb-${table.schema.name}-from-edge-${fromTable}`,
				source: fromTable,
				target: table.schema.name,
				markerEnd: {
					type: MarkerType.Arrow,
					width: 14,
					height: 14,
					color: "#ffffff",
				},
			});

			const node = nodeIndex[fromTable];

			if (node) {
				node.data.hasOutgoing = true;
			}

			edgeIndex.set(`${fromTable}:${table.schema.name}`, true);
			edgeIndex.set(`${table.schema.name}:${fromTable}`, true);
		}

		for (const toTable of to) {
			if (!nodeIndex[toTable]) {
				warnings.push({
					type: "edge",
					table: table.schema.name,
					foreign: toTable,
					direction: "out",
				});
				continue;
			}

			edges.push({
				...baseEdge,
				id: `tb-${table.schema.name}-to-edge-${toTable}`,
				source: table.schema.name,
				target: toTable,
				markerEnd: {
					type: MarkerType.Arrow,
					width: 14,
					height: 14,
					color: "#ffffff",
				},
			});

			const node = nodeIndex[toTable];

			if (node) {
				node.data.hasIncoming = true;
			}

			edgeIndex.set(`${toTable}:${table.schema.name}`, true);
			edgeIndex.set(`${table.schema.name}:${toTable}`, true);
		}
	}

	// Define all record links
	if (showLinks) {
		const uniqueLinks = new Set<string>();
		const linkColor = getComputedStyle(document.body).getPropertyValue(
			"--mantine-color-slate-5",
		);

		for (const table of tables) {
			for (const field of table.fields) {
				if (
					!field.kind ||
					field.name === "id" ||
					field.name === "in" ||
					field.name === "out"
				) {
					continue;
				}

				const targets = extractKindRecords(field.kind);

				for (const target of targets) {
					if (
						target === table.schema.name ||
						edgeIndex.has(`${table.schema.name}:${target}`) ||
						edgeIndex.has(`${target}:${table.schema.name}`)
					) {
						continue;
					}

					if (!nodeIndex[target]) {
						warnings.push({
							type: "link",
							table: table.schema.name,
							foreign: target,
							field: field.name,
						});
						continue;
					}

					const existing =
						uniqueLinks.has(`${table.schema.name}:${target}`) ||
						uniqueLinks.has(`${target}:${table.schema.name}`);

					if (existing) {
						continue;
					}

					const edge: Edge = {
						...baseEdge,
						id: `tb-${table.schema.name}-field-${field.name}:${target}`,
						source: table.schema.name,
						target,
						className: classes.recordLink,
						label: field.name,
						labelBgStyle: { fill: "var(--mantine-color-slate-8" },
						labelStyle: { fill: "currentColor" },
						data: { linkCount: 1 },
						markerEnd: {
							type: MarkerType.Arrow,
							width: 14,
							height: 14,
							color: linkColor,
						},
					};

					uniqueLinks.add(`${table.schema.name}:${target}`);
					uniqueLinks.add(`${target}:${table.schema.name}`);

					edges.push(edge);
				}
			}
		}
	}

	return [nodes, edges, warnings];
}

/**
 * Apply a layout to the given nodes and edges
 *
 * @param nodes The nodes to layout
 * @param edges The edges to layout
 * @returns The changes to apply
 */
export async function applyNodeLayout(
	nodes: Node[],
	edges: Edge[],
	direction: DiagramDirection,
): Promise<[NodeChange[], EdgeChange[]]> {
	const ELK = await import("elkjs/lib/elk.bundled");
	const elk = new ELK.default();

	const edgeIndex = objectify(edges, (e) => e.id);

	const graph = {
		id: "root",
		children: nodes.map((node) => ({
			id: node.id,
			width: node.measured?.width ?? node.width,
			height: node.measured?.height ?? node.height,
		})),
		edges: edges.map((edge) => ({
			id: edge.id,
			sources: [edge.source],
			targets: [edge.target],
		})),
	};

	const layout = await elk.layout(graph, {
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.layered.spacing.nodeNodeBetweenLayers": "100",
			"elk.spacing.nodeNode": "80",
			"elk.direction": direction === "ltr" ? "RIGHT" : "LEFT",
		},
	});

	const children = layout.children || [];
	const layoutEdges = layout.edges || [];

	const nodeChanges: NodeChange[] = children.map(({ id, x, y }) => {
		return {
			id,
			type: "position",
			position: {
				x: x ?? 0,
				y: y ?? 0,
			},
		};
	});

	const edgeChanges: EdgeChange[] = layoutEdges.map(({ id, sections }) => {
		const current = edgeIndex[id];

		return {
			id,
			type: "replace",
			item: {
				...current,
				data: {
					...current.data,
					isDragged: false,
					path: sections?.[0],
				},
			},
		};
	});

	return [nodeChanges, edgeChanges];
}

/**
 * Create a snapshot of the given element
 *
 * @param el The element to snapshot
 * @param type The type of output to create
 * @returns
 */
export async function createSnapshot(el: HTMLElement, type: "png" | "svg") {
	if (type === "png") {
		return toBlob(el, { cacheBust: true });
	}

	const dataUrl = await toSvg(el, { cacheBust: true });
	const res = await fetch(dataUrl);

	return await res.blob();
}
