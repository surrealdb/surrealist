import 'reactflow/dist/style.css';
import { ActionIcon, Group } from "@mantine/core";
import { mdiAdjust, mdiDownload, mdiRefresh } from "@mdi/js";
import { ElementRef, useEffect, useRef } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";
import { Background, ReactFlow, useEdgesState, useNodesState } from "reactflow";
import { TableCreator } from '~/components/TableCreator';
import { NODE_TYPES, buildTableGraph } from './helpers';

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
		const [nodes, edges] = buildTableGraph(props.tables, props.active);

		setNodes(nodes);
		setEdges(edges);
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
					onEdgesChange={onEdgesChange}
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