import { Center, Text, useMantineTheme } from "@mantine/core";
import { mdiAdjust } from "@mdi/js";
import { Panel } from "~/components/Panel";
import { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma/sigma";
import { useIsLight } from "~/hooks/theme";
import { useHasSchemaAccess } from "~/hooks/schema";

export interface GraphPaneProps {
	isOnline: boolean;
	graph: Graph | null;
	onCreated: (Graph: Sigma) => void;
}

export function GraphPane(props: GraphPaneProps) {
	const isLight = useIsLight();
	const theme = useMantineTheme();
	const hasAccess = useHasSchemaAccess();
	const ref = useRef<HTMLDivElement>(null);
	const sigma = useRef<Sigma | null>(null);

	const nodeColor = isLight? theme.colors.blue[5] : theme.colors.blue[5];
	const edgeColor = isLight ? theme.colors.light[1] : theme.colors.dark[4];
	const nodeLabelColor = isLight ? theme.colors.dark[9] : theme.colors.light[0];
	const edgeLabelColor = isLight ? theme.colors.dark[3] : theme.colors.light[2];

	const showGraph = props.isOnline && hasAccess && props.graph;
	
	useEffect(() => {
		const instance = new Sigma(props.graph || new Graph(), ref.current!, {
			defaultNodeColor: nodeColor,
			defaultEdgeColor: edgeColor,
			allowInvalidContainer: true,
			renderEdgeLabels: true,
			labelFont: 'JetBrains Mono',
			edgeLabelFont: 'JetBrains Mono',
			labelColor: { color: nodeLabelColor },
			edgeLabelColor: { color: edgeLabelColor },
			hoverRenderer(context, data, settings) {
				// keep empty to override default hover renderer
			},
		});

		sigma.current = instance;

		props.onCreated(instance);
	}, []);

	useEffect(() => {
		const curr = sigma.current;

		if (curr) {
			curr.clear();
			curr.setGraph(props.graph || new Graph());
			curr.refresh();
		}
	}, [props.graph]);

	useEffect(() => {
		const curr = sigma.current;

		if (curr) {
			curr.setSetting('defaultNodeColor', nodeColor);
			curr.setSetting('defaultEdgeColor', edgeColor);
			curr.setSetting('labelColor', { color: nodeLabelColor });
			curr.setSetting('edgeLabelColor', { color: edgeLabelColor });
		}
	}, [isLight]);

	return (
		<Panel
			title="Schema Graph"
			icon={mdiAdjust}
		>
			<div
				ref={ref}
				style={{
					width: '100%',
					height: '100%',
					display: showGraph ? undefined : 'none'
				}}
			/>

			{!hasAccess ? (
				<Center h="100%">
					<Text color="gray.5">
						You are using an unsupported authentication mode
					</Text>
				</Center>
			) : !props.isOnline ? (
				<Center h="100%">
					<Text color="gray.5">
						You must be connected to a database to view the schema graph
					</Text>
				</Center>
			) : !props.graph && (
				<Center h="100%">
					<Text color="gray.5">
						Press "Visualize" to view the schema graph for the current database
					</Text>
				</Center>
			)}
		</Panel>
	)
}