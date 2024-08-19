import classes from "./style.module.scss";
import { EdgeNode } from "./nodes/EdgeNode";
import { TableNode } from "./nodes/TableNode";
import { DiagramDirection, TableInfo } from "~/types";
import { extractEdgeRecords } from "~/util/schema";
import { Edge, Node, NodeChange, Position } from "reactflow";
import { toBlob, toSvg } from "html-to-image";
import { getSetting } from "~/util/config";
import { extractKindRecords } from "~/util/surrealql";

type EdgeWarning = { type: "edge", table: string, foreign: string, direction: "in" | "out" };
type LinkWarning = { type: "link", table: string, foreign: string, field: string };

export const NODE_TYPES = {
	table: TableNode,
	edge: EdgeNode,
};

export type InternalNode = Node & { width: number, height: number };
export type GraphWarning = EdgeWarning | LinkWarning;

export interface NodeData {
	table: TableInfo;
	isSelected: boolean;
	hasIncoming: boolean;
	hasOutgoing: boolean;
}

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
	showLinks: boolean
): [Node[], Edge[], GraphWarning[]] {
	const lineStyle= getSetting("appearance", "lineStyle");

	const items = normalizeTables(tables);
	const nodeIndex: Record<string, Node> = {};
	const edges: Edge[] = [];
	const nodes: Node[] = [];

	// Base edge options
	const baseEdge: any = {};

	switch (lineStyle) {
		case "metro": {
			baseEdge.type = "smoothstep";
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
		const node: Node<NodeData> = {
			id: name,
			type: isEdge ? "edge" : "table",
			position: { x: 0, y: 0 },
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
			data: {
				table,
				isSelected: false,
				hasIncoming: false,
				hasOutgoing: false
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
					direction: "in"
				});
				continue;
			}

			edges.push({
				...baseEdge,
				id: `tb-${table.schema.name}-from-edge-${fromTable}`,
				source: fromTable,
				target: table.schema.name
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
					direction: "out"
				});
				continue;
			}

			edges.push({
				...baseEdge,
				id: `tb-${table.schema.name}-to-edge-${toTable}`,
				source: table.schema.name,
				target: toTable
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

		for (const table of tables) {
			for (const field of table.fields) {
				if (!field.kind || field.name == 'id' || field.name == 'in' || field.name == 'out') {
					continue;
				}

				const targets = extractKindRecords(field.kind);

				for (const target of targets) {
					if (
						target == table.schema.name ||
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
							field: field.name
						});
						continue;
					}

					const existing = uniqueLinks.has(`${table.schema.name}:${target}`) || uniqueLinks.has(`${target}:${table.schema.name}`);

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
						labelBgStyle: { fill: 'var(--mantine-color-slate-8' },
						labelStyle: { fill: 'white' },
						data: { linkCount: 1 }
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

type DimensionNode = { id: string, width: number, height: number };

/**
 * Apply a layout to the given nodes and edges
 *
 * @param nodes The nodes to layout
 * @param edges The edges to layout
 * @returns The changes to apply
 */
export async function applyNodeLayout(
	nodes: DimensionNode[],
	edges: Edge[],
	direction: DiagramDirection
): Promise<NodeChange[]> {
	if (nodes.some((node) => !node.width || !node.height)) {
		return [];
	}

	const ELK = await import("elkjs/lib/elk.bundled");
	const elk = new ELK.default();
	const graph = {
		id: 'root',
		children: nodes.map(node => ({
			id: node.id,
			width: node.width,
			height: node.height,
		})),
		edges: edges.map(edge => ({
			id: edge.id,
			sources: [edge.source],
			targets: [edge.target]
		}))
	};

	const layout = await elk.layout(graph, {
		layoutOptions: {
			'elk.algorithm': 'layered',
			'elk.layered.spacing.nodeNodeBetweenLayers': '100',
			'elk.spacing.nodeNode': '80',
			'elk.direction': direction == "ltr" ? 'RIGHT' : 'LEFT'
		}
	});

	const children = layout.children || [];

	return children.map(({ id, x, y }) => {
		return {
			id,
			type: "position",
			position: { x: x!, y: y! }
		};
	});
}

/**
 * Create a snapshot of the given element
 *
 * @param el The element to snapshot
 * @param type The type of output to create
 * @returns
 */
export async function createSnapshot(el: HTMLElement, type: 'png' | 'svg') {
	if (type == 'png') {
		return toBlob(el, { cacheBust: true });
	} else {
		const dataUrl = await toSvg(el, { cacheBust: true });
		const res = await fetch(dataUrl);

		return await res.blob();
	}
}