import { Button, Center, Group } from "@mantine/core";
import { mdiDotsGrid } from "@mdi/js";
import { FC, useLayoutEffect, useState } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { StructureTab, STRUCTURE_TABS } from "~/constants";
import { Table } from "~/typings";
import { EventsTab } from "./tabs/events";
import { FieldsTab } from "./tabs/fields";
import { GraphTab } from "./tabs/graph";
import { IndexesTab } from "./tabs/indexes";
import { SchemaTab } from "./tabs/schema";

const TABS = {
	graph: GraphTab,
	schema: SchemaTab,
	fields: FieldsTab,
	indexes: IndexesTab,
	events: EventsTab
} as const;

export interface SchemaPaneProps {
	table: Table | undefined;
}

export function StructurePane(props: SchemaPaneProps) {
	const [activeTab, setActiveTab] = useState<StructureTab>('schema');

	const TabComponent = TABS[activeTab];
	
	useLayoutEffect(() => {
		if (!props.table) {
			setActiveTab('graph');
		}
	}, [props.table]);

	return (
		<Panel
			icon={mdiDotsGrid}
			title="Structure"
			rightSection={
				<Group>
					<Button.Group
						style={{ gap: 2 }}
					>
						{STRUCTURE_TABS.map(tab => (
							<Button
								key={tab.id}
								leftIcon={<Icon path={tab.icon} />}
								color={activeTab === tab.id ? 'surreal' : 'dark'}
								onClick={() => setActiveTab(tab.id)}
								disabled={!props.table && tab.id !== 'graph'}
								size="xs"
							>
								{tab.name}
							</Button>
						))}
					</Button.Group>
				</Group>
			}
		>
			<TabComponent
				table={props.table}
			/>
		</Panel>
	)
}