import { Text } from "@mantine/core";
import { mdiDotsGrid } from "@mdi/js";
import { useLayoutEffect, useState } from "react";
import { Panel } from "~/components/Panel";
import { StructureTab } from "~/constants";
import { TableDefinition } from "~/typings";
import { BuilderTab } from "./builder";

export interface SchemaPaneProps {
	table: TableDefinition | null;
}

export function StructurePane(props: SchemaPaneProps) {
	const [activeTab, setActiveTab] = useState<StructureTab>('builder');
	const [isDirty, setIsDirty] = useState(false);

	useLayoutEffect(() => {
		if (!props.table) {
			setActiveTab('graph');
		}
	}, [props.table]);

	return (
		<Panel
			icon={mdiDotsGrid}
			title="Structure"
			leftSection={
				isDirty && <Text color="red"> There are unsaved changes</Text>
			}
			// rightSection={
			// 	<Group>
			// 		<Button.Group
			// 			style={{ gap: 2 }}
			// 		>
			// 			{STRUCTURE_TABS.map(tab => (
			// 				<Button
			// 					key={tab.id}
			// 					leftIcon={<Icon path={tab.icon} />}
			// 					color={activeTab === tab.id ? 'surreal' : 'dark'}
			// 					onClick={() => setActiveTab(tab.id)}
			// 					disabled={!props.table && tab.id === 'builder'}
			// 					size="xs"
			// 				>
			// 					{tab.name}
			// 				</Button>
			// 			))}
			// 		</Button.Group>
			// 	</Group>
			// }
		>
			{props.table && (
				<BuilderTab
					table={props.table}
					onChangedState={setIsDirty}
				/>	
			)}
			{/* {activeTab == 'builder' && props.table ? (
				<BuilderTab
					table={props.table}
				/>	
			) : activeTab == 'graph' && (
				<GraphTab />
			)} */}
		</Panel>
	)
}