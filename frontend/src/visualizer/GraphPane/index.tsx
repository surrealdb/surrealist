import { ActionIcon, Group } from "@mantine/core";
import { mdiGraph, mdiRefresh } from "@mdi/js";
import { Graph } from "~/components/Graph";
import { Icon } from "../../components/Icon";
import { Panel } from "../../components/Panel";

export interface GraphPaneProps {

}

export function GraphPane(props: GraphPaneProps) {


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
			<Graph
				
			/>
		</Panel>
	)
}