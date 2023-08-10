import 'reactflow/dist/style.css';
import { ActionIcon, Group } from "@mantine/core";
import { mdiAdjust, mdiDownload, mdiRefresh } from "@mdi/js";
import { ElementRef, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";
import { Background, Node, Position, ReactFlow, useEdgesState, useNodesState } from "reactflow";
import { TableNode } from "~/views/designer/TableGraphPane/TableNode";
import { TableCreator } from '~/components/TableCreator';

export interface TableGraphPaneProps {
	tables: TableDefinition[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [selectedTable, setSelectedTable] = useState('');
	const ref = useRef<ElementRef<'div'>>(null);

	const nodeTypes = useMemo(() => ({
		table: TableNode
	}), []);

	useEffect(() => {
		// TODO graph stuff
	}, []);

	useEffect(() => {
		const nodes = props.tables.map((table, i): Node => ({
			id: table.schema.name,
			type: 'table',
			position: { x: 0, y: 150 * i },
			sourcePosition: Position.Right,
			targetPosition: Position.Left,
			data: {
				table,
				isSelected: selectedTable == table.schema.name
			}
		}));

		setNodes(nodes);
	}, [props.tables, selectedTable]);

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
					nodeTypes={nodeTypes}
					nodes={nodes}
					edges={edges}
					proOptions={{ hideAttribution: true }}
					onNodesChange={onNodesChange}
					onNodeClick={(ev, node) => {
						props.setActiveTable(node.id);

						setSelectedTable(node.id);
					}}
				>
					<Background />
				</ReactFlow>
			</div>
		</Panel>
	);
}