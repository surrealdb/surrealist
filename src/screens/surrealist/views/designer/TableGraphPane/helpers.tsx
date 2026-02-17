import {
	type Edge,
	type EdgeChange,
	type EdgeTypes,
	MarkerType,
	type Node,
	type NodeChange,
	type NodeTypes,
	Rect,
} from "@xyflow/react";
import { elementToSVG, inlineResources } from "dom-to-svg";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import type {
	DiagramAlgorithm,
	DiagramDirection,
	DiagramLineStyle,
	DiagramLinks,
	DiagramMode,
	DiagramStrategy,
	TableInfo,
	TableVariant,
} from "~/types";
import { extractEdgeRecords, getTableVariant } from "~/util/schema";
import { ElkStepEdge } from "./edges/ElkEdge";
import { NormalTableNode } from "./nodes/NormalTableNode";
import { RelationTableNode } from "./nodes/RelationTableNode";
import { ViewTableNode } from "./nodes/ViewTableNode";
import classes from "./style.module.scss";

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
	links: number;
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

export async function buildFlowNodes(
	tables: TableInfo[],
	nodeMode: DiagramMode,
	direction: DiagramDirection,
	linkMode: DiagramLinks,
	lineStyle: DiagramLineStyle,
): Promise<[Node<SharedNodeData>[], Edge[], GraphWarning[]]> {
	const items = normalizeTables(tables);
	const nodeIndex = new Map<string, Node<SharedNodeData>>();
	const edges: Edge[] = [];
	const nodes: Node<SharedNodeData>[] = [];

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

	// Height of an individual field row
	const fieldHeight = 18.59;
	// Gap between individual field rows
	const fieldGap = 6;

	// padding top + padding bottom + header gap + header height + header margin
	const staticHeight = 12 + 12 + 9 + fieldHeight + 10;

	// Define all nodes
	for (const { table, variant } of items) {
		const name = table.schema.name;

		const nodeHeight =
			nodeMode === "fields"
				? // field row height, plus the gaps between rows, plus static height.
					Math.max(table.fields.length, 1) * fieldHeight +
					(Math.max(table.fields.length, 1) - 1) * fieldGap +
					staticHeight
				: undefined;

		const node = {
			id: name,
			type: variant,
			position: { x: 0, y: 0 },
			deletable: false,
			data: {
				table,
				isSelected: false,
				direction: direction,
				mode: nodeMode,
				links: 0,
			} as SharedNodeData,
			height: nodeHeight ? nodeHeight + (variant === "relation" ? 20 : 0) : undefined,
			width: nodeMode === "fields" ? 250 : undefined,
		};

		nodes.push(node);
		nodeIndex.set(name, node);
	}

	const edgeItems = items.filter((item) => item.variant === "relation");
	const edgeIndex = new Map<string, boolean>();
	const warnings: GraphWarning[] = [];
	const linkedNodes = new Set<string>();

	// Define all edges (Relation Tables)
	for (const { table, from, to } of edgeItems) {
		for (const fromTable of from) {
			if (!nodeIndex.has(fromTable)) {
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
			linkedNodes.add(fromTable);
			linkedNodes.add(table.schema.name);

			const fromNode = nodeIndex.get(fromTable);
			if (fromNode?.data) {
				fromNode.data.links++;
			}
			const toNode = nodeIndex.get(table.schema.name);
			if (toNode?.data) {
				toNode.data.links++;
			}
		}

		for (const toTable of to) {
			if (!nodeIndex.has(toTable)) {
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
			linkedNodes.add(toTable);
			linkedNodes.add(table.schema.name);

			const fromNode = nodeIndex.get(table.schema.name);
			if (fromNode?.data) {
				fromNode.data.links++;
			}
			const toNode = nodeIndex.get(toTable);
			if (toNode?.data) {
				toNode.data.links++;
			}
		}
	}

	// Define all record links
	if (linkMode === "visible") {
		const uniqueLinks = new Map<string, Edge>();
		const linkColor = getComputedStyle(document.body).getPropertyValue(
			"--mantine-color-obsidian-5",
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

				const targets = await getSurrealQL().extractKindRecords(field.kind);

				for (const target of targets) {
					if (!nodeIndex.has(target)) {
						warnings.push({
							type: "link",
							table: table.schema.name,
							foreign: target,
							field: field.name,
						});
						continue;
					}

					if (!uniqueLinks.has(`${table.schema.name}:${target}`)) {
						const edge: Edge = {
							...baseEdge,
							id: `tb-${table.schema.name}-field-${field.name}:${target}`,
							source: table.schema.name,
							target,
							className: classes.recordLink,
							labelBgStyle: { fill: "var(--mantine-color-obsidian-8" },
							labelStyle: { fill: "currentColor" },
							label: field.name,
							data: {
								linkCount: 1,
								fields: [field.name],
							},
							markerEnd: {
								type: MarkerType.Arrow,
								width: 14,
								height: 14,
								color: linkColor,
							},
						};
						uniqueLinks.set(`${table.schema.name}:${target}`, edge);
						linkedNodes.add(target);
						linkedNodes.add(table.schema.name);

						const fromNode = nodeIndex.get(table.schema.name);
						if (fromNode?.data) {
							fromNode.data.links++;
						}
						const toNode = nodeIndex.get(target);
						if (toNode?.data) {
							toNode.data.links++;
						}
					} else {
						// Update existing link count
						const edge = uniqueLinks.get(`${table.schema.name}:${target}`);
						if (edge) {
							if (typeof edge.data?.linkCount === "number") {
								edge.data.linkCount++;
							}
							(edge.data?.fields as string[])?.push(field.name);
						}
					}
				}
			}
		}

		edges.push(
			...Array.from(uniqueLinks.values()).map((edge) => {
				if ((edge.data?.fields as string[]).length > 1) {
					edge.label = `${edge.data?.linkCount} links`;
				}
				return edge;
			}),
		);
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
	nodes: Node<SharedNodeData>[],
	edges: Edge[],
	algorithm: DiagramAlgorithm,
	direction: DiagramDirection,
	strategy: DiagramStrategy = "NETWORK_SIMPLEX",
): Promise<[NodeChange[], EdgeChange[]]> {
	const ELK = await import("elkjs/lib/elk.bundled");
	const elk = new ELK.default();

	const edgeIndex = new Map<string, Edge>();
	edges.forEach((e) => edgeIndex.set(e.id, e));

	const linkedNodes = nodes.filter((node) => node.data.links > 0);
	const orphanNodes = nodes.filter((node) => node.data.links === 0);

	const linkedGraph = {
		id: "root",
		children: linkedNodes.map((node) => ({
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

	const orphanGraph = {
		id: "root_orphans",
		children: orphanNodes.map((node) => ({
			id: node.id,
			width: node.measured?.width ?? node.width,
			height: node.measured?.height ?? node.height,
		})),
		edges: [],
	};

	const nodeEdgeGap = "40";
	const nodeNodeGap = "80";

	const linkedLayout = await elk.layout(linkedGraph, {
		layoutOptions: {
			"elk.algorithm": algorithm === "spaced" ? "force" : "layered",
			"elk.direction": direction === "ltr" ? "RIGHT" : "LEFT",
			"elk.layered.nodePlacement.strategy": strategy,

			// minimum gap between nodes
			"elk.spacing.nodeNode": nodeNodeGap,
			"elk.layered.spacing.nodeNodeBetweenLayers": nodeNodeGap,
			"elk.spacing.edgeNode": nodeEdgeGap,
			"elk.layered.spacing.edgeEdgeBetweenLayers": nodeEdgeGap,
			"elk.layered.spacing.edgeNodeBetweenLayers": nodeEdgeGap,
			"elk.layered.wrapping.additionalEdgeSpacing": nodeEdgeGap,
			"elk.spacing.nodeSelfLoop": nodeEdgeGap,
		},
	});

	const orphanLayout = await elk.layout(orphanGraph, {
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.layered.spacing.nodeNodeBetweenLayers": nodeNodeGap,
			"elk.spacing.nodeNode": nodeNodeGap,
		},
	});

	const linkedChildren = linkedLayout.children || [];
	const orphanChildren = orphanLayout.children || [];

	const linkedEdges = linkedLayout.edges || [];

	console.log("Linked layout", linkedLayout);
	console.log("Orphan layout", orphanLayout);

	const nodeChanges: NodeChange[] = linkedChildren
		.map(({ id, x, y }) => {
			return {
				id,
				type: "position" as "position",
				position: {
					x: x ?? 0,
					y: y ?? 0,
				},
			};
		})
		.concat(
			orphanChildren.map(({ id, x, y }) => {
				return {
					id,
					type: "position" as "position",
					position: {
						x: (x ?? 0) + (linkedLayout.width ?? 0) + parseInt(nodeEdgeGap),
						y: y ?? 0,
					},
				};
			}),
		);

	const edgeChanges: EdgeChange[] = linkedEdges.map(({ id, sections }) => {
		const current = edgeIndex.get(id);
		if (!current) {
			return {
				id,
				type: "remove",
			};
		}

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
export async function createSnapshot(el: HTMLElement, type: "png" | "svg", nodesBounds: Rect) {
	const padding = 24;

	const oldTransform = el.style.transform;
	el.style.width = `${nodesBounds.width + padding}px`;
	el.style.height = `${nodesBounds.height + padding}px`;
	el.style.transform = `translate(${padding}px, ${padding}px) scale(1)`;

	const svgDocument = elementToSVG(el);
	await inlineResources(svgDocument.documentElement);

	// Restore the transformation
	el.style.transform = oldTransform;
	el.style.width = ``;
	el.style.height = ``;

	const svgString = new XMLSerializer().serializeToString(svgDocument);

	const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
	if (type === "svg") {
		return svgBlob;
	} else if (type === "png") {
		// For PNG we need to render the SVG onto a canvas.
		const canvas = document.createElement("canvas");
		const context = canvas.getContext("2d");

		if (!context) {
			return "";
		}

		canvas.width = nodesBounds.width + padding;
		canvas.height = nodesBounds.height + padding;
		canvas.style.width = `${canvas.width}px`;
		canvas.style.height = `${canvas.height}px`;

		const img = new Image();
		const url = URL.createObjectURL(svgBlob);
		img.src = url;

		await new Promise<void>((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = (e) => reject(e);
		});

		context.drawImage(img, 0, 0);

		const pngUrl = canvas.toDataURL("image/png");
		return await fetch(pngUrl).then((res) => res.blob());
	}
	return "";
}

/**
 * Apply a default value if the given value is "default"
 */
export function applyDefault<T extends string>(value: T | undefined, fallback: T) {
	return !value || value === "default" ? fallback : value;
}
