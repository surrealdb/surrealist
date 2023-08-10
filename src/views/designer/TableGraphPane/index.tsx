import 'reactflow/dist/style.css';
import { ActionIcon, Group } from "@mantine/core";
import { mdiAdjust, mdiDownload, mdiRefresh } from "@mdi/js";
import { ElementRef, useEffect, useRef } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";
import { extractEdgeRecords, fetchDatabaseSchema } from "~/util/schema";
import { Background, Edge, Node, Position, ReactFlow, applyNodeChanges, useEdgesState, useNodesState } from "reactflow";
import { TableCreator } from '~/components/TableCreator';
import { NODE_TYPES } from './helpers';

export interface TableGraphPaneProps {
	active: TableDefinition | null;
	tables: TableDefinition[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const ref = useRef<ElementRef<'div'>>(null);

	useEffect(() => {
		const nodes = props.tables.map((table, i): Node => ({
			id: table.schema.name,
			type: 'table',
			position: { x: 0, y: 150 * i },
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
			data: {
				table,
				isSelected: props.active?.schema.name == table.schema.name
			}
		}));

		console.log(nodes);

		setNodes(nodes);
		
	}, [props.tables, props.active]);

	useEffect(() => {
		const edges: Edge[] = [];
		const nodes: Node[] = [];
		
		for (const [i, table] of props.tables.entries()) {
			const [isEdge, from, to] = extractEdgeRecords(table);

			for (const fromTable of from) {
				edges.push({
					id: table.schema.name + fromTable,
					source: fromTable,
					target: table.schema.name,
					focusable: false
				});
			}

			for (const toTable of to) {
				edges.push({
					id: table.schema.name + toTable,
					source: table.schema.name,
					target: toTable,
					focusable: false
				});
			}
			
			nodes.push({
				id: table.schema.name,
				type: isEdge ? 'edge' : 'table',
				position: { x: 0, y: 150 * i },
				sourcePosition: Position.Right,
				targetPosition: Position.Left,
				draggable: false,
				data: {
					table,
					isSelected: props.active?.schema.name == table.schema.name
				}
			});
		}

		setEdges(edges);
		setNodes(nodes);

		// setNodes(current => applyNodeChanges([], current));
		
	}, [props.tables, props.active]);

	return (
		<Panel
			title="Table Graph"
			icon={mdiAdjust}
			rightSection={
				<Group noWrap>
					<ActionIcon
						title="Refresh"
					>
						<Icon color="light.4" path={mdiDownload} />
					</ActionIcon>
					<ActionIcon
						title="Refresh"
						onClick={fetchDatabaseSchema}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
					<TableCreator />
				</Group>
			}
		>

			<div ref={ref} style={{ width: '100%', height: '100%' }}>
				<ReactFlow
					nodeTypes={NODE_TYPES}
					nodes={nodes}
					edges={edges}
					proOptions={{ hideAttribution: true }}
					onNodesChange={onNodesChange}
					onNodeClick={(_ev, node) => {
						props.setActiveTable(node.id);
					}}
				>
					<Background />
				</ReactFlow>
			</div>
		</Panel>
	);
}