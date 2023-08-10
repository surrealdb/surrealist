import 'reactflow/dist/style.css';
import { ActionIcon, Group, Kbd, LoadingOverlay, Modal, Text, Title } from "@mantine/core";
import { mdiAdjust, mdiDownload, mdiHelpCircle, mdiPlus, mdiRefresh } from "@mdi/js";
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

interface HelpTitleProps {
	isLight: boolean;
	children: React.ReactNode;
}

function HelpTitle({ isLight, children }: HelpTitleProps) {
	return (
		<Title
			order={2}
			size={14}
			color={isLight ? 'light.7' : 'light.1'}
			weight={600}
		>
			{children}
		</Title>
	);
}

export interface TableGraphPaneProps {
	active: TableDefinition | null;
	tables: TableDefinition[];
	setActiveTable: (table: string) => void;
}

export function TableGraphPane(props: TableGraphPaneProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);
	const [showBackground, setShowBackground] = useState(true);
	const [showHelp, setShowHelp] = useState(false);
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

	const openHelp = useStable(() => {
		setShowHelp(true);
	});

	const closeHelp = useStable(() => {
		setShowHelp(false);
	});

	return (
		<Panel
			title="Table Graph"
			icon={mdiAdjust}
			rightSection={
				<Group noWrap>
					<TableCreator />
					<ActionIcon
						title="Refresh"
						onClick={fetchDatabaseSchema}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
					<ActionIcon
						title="Save as image"
						onClick={saveImage}
					>
						<Icon color="light.4" path={mdiDownload} />
					</ActionIcon>
					<ActionIcon
						title="Help"
						onClick={openHelp}
					>
						<Icon color="light.4" path={mdiHelpCircle} />
					</ActionIcon>
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

			<Modal
				opened={showHelp}
				onClose={closeHelp}
				trapFocus={false}
				size="lg"
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Using the Table Graph
					</Title>
				}
			>
				<Text color={isLight ? 'light.7' : 'light.3'}>
					<HelpTitle isLight={isLight}>
						How do I use the table graph?
					</HelpTitle>

					<Text mt={8} mb="xl">
						The table graph will automatically render based on the tables in your database.
						You can click on a table to view its details and modify it's schema. Changes made to the
						schema will be reflected in the graph.
					</Text>

					<HelpTitle isLight={isLight}>
						Why are edges missing?
					</HelpTitle>

					<Text mt={8} mb="xl">
						Surrealist dermines edges by searching for correctly configured <Kbd>in</Kbd> and <Kbd>out</Kbd> fields.
						You can automatically create a new edge table by pressing the <Icon path={mdiPlus}/> button on the Table Graph panel.
					</Text>

					<HelpTitle isLight={isLight}>
						Can I save the graph as an image?
					</HelpTitle>

					<Text mt={8}>
						Press the <Icon path={mdiDownload}/> button on the Table Graph panel to save the current graph as a PNG image. This snapshot
						will use your current theme, position, and scale.
					</Text>
				</Text>
			</Modal>
		</Panel>
	);
}