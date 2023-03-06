import Graph, { MultiDirectedGraph } from "graphology";
import { useEffect, useRef, useState } from "react";
import { Splitter } from "~/components/Splitter";
import { GraphPane } from "../GraphPane";
import { useStoreValue } from "~/store";
import { extractEdgeRecords } from "~/util/schema";
import { OptionsPane } from "../OptionsPane";
import { useStable } from "~/hooks/stable";
import { circular } from 'graphology-layout';
import { inferSettings } from 'graphology-layout-forceatlas2';
import { Button, Checkbox, Group, Modal, Stack, TextInput, Title, useMantineTheme } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import FA2Layout from 'graphology-layout-forceatlas2/worker';
import Sigma from "sigma";
import { Form } from "~/components/Form";
import { save } from '@tauri-apps/api/dialog';
import { writeBinaryFile } from '@tauri-apps/api/fs';
import { Spacer } from "~/components/Spacer";
import { createSnapshot } from "./snapshot";
import { useInputState } from "@mantine/hooks";
import { Settings } from "sigma/settings";

export interface VisualizerViewProps {
}

export function VisualizerView(props: VisualizerViewProps) {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const layoutRef = useRef<any>(null);
	const schema = useStoreValue(state => state.databaseSchema);
	const [sigma, setSigma] = useState<Sigma | null>(null);
	const [graph, setGraph] = useState<MultiDirectedGraph | null>(null);
	const [isExporting, setIsExporting] = useState(false);
	const [isExportOpaque, setIsExportOpaque] = useInputState(true);
	const [isExportDark, setIsExportDark] = useInputState(false);
	const [exportZoom, setExportZoom] = useInputState('100%');

	const spreadNodes = useStable((graph: Graph) => {
		circular.assign(graph);

		const layout = new FA2Layout(graph, {
			settings: inferSettings(graph)
		});
		
		layout.start();

		layoutRef.current?.kill();
		layoutRef.current = layout;
	})

	const refreshGraph = useStable(() => {
		const graph = new MultiDirectedGraph();
		const data = schema.map(table => [
			table.schema.name,
			...extractEdgeRecords(table)
		] as const);

		// 1st pass: place all tables into the graph
		for (const [tableName, isEdge] of data) {
			if (!isEdge) {
				graph.addNode(tableName, {
					label: tableName,
					size: 12,
					forceLabel: true
				});
			}
		}

		// 2nd pass: place all edges into the graph
		for (const [tableName, isEdge, inTables, outTables] of data) {
			if (isEdge) {
				for (const inTable of inTables) {
					for (const outTable of outTables) {
						try {
							const existing = graph.edges(inTable, outTable)[0];

							if (existing) {
								const label = graph.getEdgeAttribute(existing, 'label');
								const condensed = graph.getEdgeAttribute(existing, 'condensed');
	

								if (condensed) {
									continue;
								}
	
								graph.setEdgeAttribute(existing, 'label', `${label} & more`);
								graph.setEdgeAttribute(existing, 'condensed', true);
								graph.setEdgeAttribute(existing, 'type', 'line');
							} else {
								graph.addDirectedEdgeWithKey(`${tableName}-${inTable}-${outTable}`, inTable, outTable, {
									label: tableName,
									type: 'arrow',
									size: 3,
									forceLabel: true
								});
							}
						} catch(e) {
							console.warn('Skipping edge', tableName, 'from', inTable, 'to', outTable);
							console.error(e);
						}
					}
				}
			}
		}

		setGraph(graph);

		if (sigma) {
			spreadNodes(graph);
		}
	});

	useEffect(() => {
		return () => {
			layoutRef.current?.kill();
		}
	}, []);

	const openExporter = useStable(() => {
		setIsExporting(true);
	});

	const closeExporter = useStable(() => {
		setIsExporting(false);
	});

	const saveSnapshot = useStable(async () => {
		const filePath = await save({
			title: 'Save snapshot',
			defaultPath: 'snapshot.png',
			filters: [{
				name: 'Image',
				extensions: ['png', 'jpg', 'jpeg']
			}]
		});

		if (!filePath || !sigma) {
			return;
		}

		const settings: Partial<Settings> = {
			defaultNodeColor: isExportDark ? theme.colors.blue[5] : theme.colors.blue[5],
			defaultEdgeColor: isExportDark ? theme.colors.dark[4] : theme.colors.light[1],
			labelColor: { color: isExportDark ? theme.colors.light[0] : theme.colors.dark[9] },
			edgeLabelColor: { color: isExportDark ? theme.colors.light[2] : theme.colors.dark[3] }
		}

		const zoom = Number.parseInt(exportZoom);
		const type = filePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
		const background = isExportOpaque ? (isExportDark ? theme.colors.dark[7] : '#fff') : null;
		const contents = await createSnapshot(sigma, type, background, zoom / 100, settings);
	
		await writeBinaryFile(filePath, await contents.arrayBuffer());

		closeExporter();
	});

	return (
		<>
			<Splitter
				minSize={[undefined, 325]}
				bufferSize={500}
				direction="horizontal"
				endPane={
					<OptionsPane
						canSnapshot={!!graph}
						onGenerate={refreshGraph}
						onSnapshot={openExporter}
					/>
				}
			>
				<GraphPane
					graph={graph}
					onCreated={setSigma}
				/>
			</Splitter>
			
			{/* ANCHOR Connection details modal */}
			<Modal
				size="sm"
				opened={isExporting}
				onClose={closeExporter}
				title={
					<Title size={16} color={isLight ? 'light.6' : 'white'}>
						Save snapshot
					</Title>
				}
			>
				<Form onSubmit={saveSnapshot}>
					<Stack>
						<TextInput
							label="Resolution scale"
							value={exportZoom}
							onChange={setExportZoom}
						/>
						<Checkbox
							checked={isExportDark}
							onChange={setIsExportDark}
							label="Dark theme"
						/>
						<Checkbox
							checked={isExportOpaque}
							onChange={setIsExportOpaque}
							label="Include background"
						/>
					</Stack>
				</Form>

				<Group mt="lg">
					<Button
						onClick={closeExporter}
						color={isLight ? 'light.5' : 'light.3'}
						variant="light"
					>
						Close
					</Button>
					<Spacer />
					<Button
						color="surreal"
						onClick={saveSnapshot}
					>
						Save
					</Button>
				</Group>
			</Modal>
		</>
	);
}