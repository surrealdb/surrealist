import { ScrollArea, SimpleGrid } from "@mantine/core";
import { forwardRef } from "react";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { isEdgeTable } from "~/util/schema";
import { EdgeNode } from "./nodes/EdgeNode";
import { TableNode } from "./nodes/TableNode";

export interface TableGridProps {
	tables: TableDefinition[];
	active: TableDefinition | null;
	nodeMode: DesignerNodeMode;
	expanded: string[],
	onSelectTable: (table: TableDefinition) => void;
	onExpand: (name: string) => void;
}

export const TableGrid = forwardRef<HTMLDivElement, TableGridProps>((props, ref) => {
	const { tables, active, nodeMode, onSelectTable, expanded, onExpand } = props;
	
	const elements = tables.map((table) => {
		const isSelected = table.schema.name === active?.schema?.name;

		const Node = isEdgeTable(table)
			? EdgeNode
			: TableNode;

		return (
			<div
				key={table.schema.name}
				onClick={() => onSelectTable(table)}
				style={{
					gridRowStart: 'auto',
					gridRowEnd: 'span auto'
				}}
			>
				<Node
					withoutGraph
					data={{
						table,
						isSelected,
						nodeMode,
						hasLeftEdge: false,
						hasRightEdge: false,
						expanded: expanded.includes(table.schema.name),
						onExpand: onExpand
					}}
				/>
			</div>
		);
	});

	return (
		<ScrollArea
			style={{
				position: "absolute",
				inset: 6,
				top: 0,
			}}
		>
			<SimpleGrid
				p="xs"
				pt={0}
				ref={ref}
				spacing="xl"
				style={{
					gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
				}}
			>
				{elements}
			</SimpleGrid>
		</ScrollArea>
	);
});

TableGrid.displayName = "TableGrid";