import 'reactflow/dist/style.css';
import { ActionIcon, Group, LoadingOverlay } from "@mantine/core";
import { mdiAdjust, mdiDownload, mdiRefresh } from "@mdi/js";
import { ElementRef, useEffect, useRef, useState } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { TableDefinition } from "~/types";
import { fetchDatabaseSchema } from "~/util/schema";
import { toBlob } from 'html-to-image';
import { Background, ReactFlow, useEdgesState, useNodesState } from "reactflow";
import { TableCreator } from '~/components/TableCreator';
import { NODE_TYPES, buildTableGraph } from './helpers';
import { useStable } from '~/hooks/stable';
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import { useLater } from '~/hooks/later';
import { useIsLight } from '~/hooks/theme';
import { showNotification } from '@mantine/notifications';

export interface TableGraphPaneProps {
	active: TableDefinition | null;
	tables: TableDefinition[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [showBackground, setShowBackground] = useState(true);
	const ref = useRef<ElementRef<'div'>>(null);
	const isLight = useIsLight();

	useEffect(() => {
		const [nodes, edges] = buildTableGraph(props.tables, props.active);

		setNodes(nodes);
		setEdges(edges);
	}, [props.tables, props.active]);

	const createSnapshot = useStable(async (filePath: string) => {
		const contents = await toBlob(ref.current!, { cacheBust: true });

		if (!contents) {
			return;
		}

		await writeBinaryFile(filePath, await contents.arrayBuffer());

		setShowBackground(true);

		showNotification({
			message: 'Snapshot saved to disk'
		});
	});

	const scheduleSnapshot = useLater(createSnapshot);

	// TODO Move download logic to adapter
	const saveImage = useStable(async () => {	
		const filePath = await save({
			title: 'Save snapshot',
			defaultPath: 'snapshot.png',
			filters: [{
				name: 'Image',
				extensions: ['png', 'jpg', 'jpeg']
			}]
		});

		if (!filePath) {
			return;
		}

		setShowBackground(false);
		scheduleSnapshot(filePath);
	});

	return (
		<Panel
			title="Table Graph"
			icon={mdiAdjust}
			rightSection={
				<Group noWrap>
					<ActionIcon
						title="Save as image"
						onClick={saveImage}
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

			<div style={{ width: '100%', height: '100%' }}>
				<LoadingOverlay
					visible={!showBackground}
					overlayBlur={4}
					overlayColor={isLight ? 'white' : 'dark.7'}
				/>

				<ReactFlow
					ref={ref}
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
					{showBackground && <Background />}
				</ReactFlow>
			</div>
		</Panel>
	);
}