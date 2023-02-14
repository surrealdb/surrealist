import { ActionIcon, Group, useMantineTheme } from "@mantine/core";
import { mdiGraph, mdiRefresh } from "@mdi/js";
import { Icon } from "../../components/Icon";
import { Panel } from "../../components/Panel";
import { useEffect, useRef } from "react";
import Graph from "graphology";
import Sigma from "sigma/sigma";

export interface GraphPaneProps {
	graph: Graph | null;
}

export function GraphPane(props: GraphPaneProps) {
	const ref = useRef<HTMLDivElement>(null);
	const sigma = useRef<Sigma | null>(null);
	const theme = useMantineTheme();
	
	useEffect(() => {
		const instance = new Sigma(props.graph || new Graph(), ref.current!, {
			allowInvalidContainer: true,
			labelColor: {
				color: 'white',
				attribute: 'background-color'
			},
			defaultNodeColor: theme.colors.surreal[5]
		});

		sigma.current = instance;
	}, []);

	useEffect(() => {
		if (sigma.current) {
			sigma.current!.clear();
			sigma.current!.setGraph(props.graph || new Graph());
			sigma.current.refresh();
		}
	}, [props.graph]);

	return (
		<Panel
			title="Database Visualizer"
			icon={mdiGraph}
			rightSection={
				<Group noWrap>
					<ActionIcon
						title="Refresh"
						onClick={() => { }}
					>
						<Icon color="light.4" path={mdiRefresh} />
					</ActionIcon>
				</Group>
			}
		>
			<div ref={ref} style={{ width: '100%', height: '100%' }} />
		</Panel>
	)
}