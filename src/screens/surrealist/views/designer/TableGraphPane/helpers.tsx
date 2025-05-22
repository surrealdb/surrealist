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

import type {
	DiagramAlgorithm,
	DiagramDirection,
	DiagramLineStyle,
	DiagramLinks,
	DiagramMode,
	TableInfo,
	TableVariant,
} from "~/types";

import { toBlob, toSvg } from "html-to-image";
import { objectify } from "radash";
import { extractEdgeRecords, getTableVariant } from "~/util/schema";
import { extractKindRecords } from "~/util/surrealql";
import { ElkStepEdge } from "./edges/ElkEdge";
import { RelationTableNode } from "./nodes/RelationTableNode";
import { NormalTableNode } from "./nodes/NormalTableNode";
import { ViewTableNode } from "./nodes/ViewTableNode";

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
	normal: NormalTableNode,
	relation: RelationTableNode,
	view: ViewTableNode,
};

export const EDGE_TYPES: EdgeTypes = {
	elk: ElkStepEdge,
};

export type InternalNode = Node & { width: number; height: number };
export type GraphWarning = EdgeWarning | LinkWarning;

export type SharedNodeData = {
	table: TableInfo;
	isSelected: boolean;
	direction: DiagramDirection;
	mode: DiagramMode;
};

interface NormalizedTable {
	variant: TableVariant;
	table: TableInfo;
	from: string[];
	to: string[];
}

function normalizeTables(tables: TableInfo[]): NormalizedTable[] {
	return tables.map((table) => {
		const [from, to] = extractEdgeRecords(table);
		const variant = getTableVariant(table);

		return {
			table,
			variant,
			to,
			from,
		};
	});
}

export function buildFlowNodes(
	tables: TableInfo[],
	nodeMode: DiagramMode,
	direction: DiagramDirection,
	linkMode: DiagramLinks,
	lineStyle: DiagramLineStyle,
): [Node[], Edge[], GraphWarning[]] {
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
	for (const { table, variant } of items) {
		const name = table.schema.name;
		const node: any = {
			id: name,
			type: variant,
			position: { x: 0, y: 0 },
			deletable: false,
			data: {
				table,
				isSelected: false,
				direction: direction,
				mode: nodeMode,
			} as SharedNodeData,
		};

		nodes.push(node);
		nodeIndex[name] = node;
	}

	const edgeItems = items.filter((item) => item.variant === "relation");
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

			edgeIndex.set(`${toTable}:${table.schema.name}`, true);
			edgeIndex.set(`${table.schema.name}:${toTable}`, true);
		}
	}

	// Define all record links
	if (linkMode === "visible") {
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
	algorithm: DiagramAlgorithm,
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
			"elk.algorithm": algorithm === "spaced" ? "force" : "layered",
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

/**
 * Apply a default value if the given value is "default"
 */
export function applyDefault<T extends string>(value: T | undefined, fallback: T) {
	return !value || value === "default" ? fallback : value;
}
