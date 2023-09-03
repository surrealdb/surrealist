import { SimpleGrid } from "@mantine/core";
import { forwardRef } from "react";
import { DesignerNodeMode, TableDefinition } from "~/types";
import { isEdgeTable } from "~/util/schema";
import { EdgeNode } from "./nodes/EdgeNode";
import { TableNode } from "./nodes/TableNode";

export interface TableGridProps {
	tables: TableDefinition[];
	active: TableDefinition | null;
	nodeMode: DesignerNodeMode;
	onSelectTable: (table: TableDefinition) => void;
}

export const TableGrid = forwardRef<HTMLDivElement, TableGridProps>((props, ref) => {
	const { tables, active, nodeMode, onSelectTable } = props;
	
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
						hasRightEdge: false 
					}}
				/>
			</div>
		);
	});

	return (
		<SimpleGrid
			ref={ref}
			style={{
				gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
			}}
		>
			{elements}
		</SimpleGrid>
	);
});

TableGrid.displayName = "TableGrid";