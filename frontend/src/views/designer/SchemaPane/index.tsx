import { Button, Center } from "@mantine/core";
import { mdiDotsGrid } from "@mdi/js";
import { useState } from "react";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { StructureTab, STRUCTURE_TABS } from "~/constants";
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
	table: string | null;
	tableInfo: any;
}

export function SchemaPane(props: SchemaPaneProps) {
	const [activeTab, setActiveTab] = useState<StructureTab>('schema');

	const TabComponent = TABS[activeTab];

	return (
		<Panel
			icon={mdiDotsGrid}
			title="Structure"
			rightSection={
				<Button.Group>
					{STRUCTURE_TABS.map(tab => (
						<Button
							key={tab.id}
							leftIcon={<Icon path={tab.icon} />}
							color={activeTab === tab.id ? 'surreal' : 'dark'}
							onClick={() => setActiveTab(tab.id)}
							size="xs"
						>
							{tab.name}
						</Button>
					))}
				</Button.Group>
			}
		>
			{(props.table && props.tableInfo) ? (
				<TabComponent
					table={props.table}
					tableInfo={props.tableInfo}
				/>
			) : (
				<Center h="100%" c="light.5">
					Select a table to view its structure
				</Center>
			)}
		</Panel>
	)
}