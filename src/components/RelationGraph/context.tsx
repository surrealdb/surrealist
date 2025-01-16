import { Box, Group, Text } from "@mantine/core";
import { ContextMenuDivider, ContextMenuItem } from "mantine-contextmenu";
import { iconSearch, iconEyeOff, iconCopy, iconChevronRight } from "~/util/icons";
import { Icon } from "../Icon";
import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { Gap, PreparedQuery, RecordId } from "surrealdb";
import { NodeCircle } from "./node";
import Graph from "graphology";
import { GraphExpansion, RelationGraphEdge, RelationGraphNode } from "./types";

type Edges = { from: string[]; to: string[] };

const RECORD = new Gap<RecordId>();
const QUERY = new PreparedQuery(
	"SELECT (<-?).map(|$id| $id.tb()).distinct() AS from, (->?).map(|$id| $id.tb()).distinct() AS to FROM ONLY $record",
	{ record: RECORD },
);

export interface NodeContextMenuProps {
	node: RelationGraphNode;
	graph: Graph<RelationGraphNode, RelationGraphEdge>;
	inspect: (record: RecordId) => void;
	onExpandNode?: (expansion: GraphExpansion) => void;
	onHideNode?: (node: RecordId) => void;
	onHideMenu: () => void;
}

export function NodeContextMenu({
	node,
	graph,
	inspect,
	onExpandNode,
	onHideNode,
	onHideMenu,
}: NodeContextMenuProps) {
	const { data, isSuccess } = useQuery({
		queryKey: ["graph-relation", node],
		enabled: true,
		queryFn: async () => {
			const [result] = await executeQuery(QUERY, [RECORD.fill(node.record)]);
			const edges: Edges = result.success ? result.result : { from: [], to: [] };
			const existing = graph
				.edges(node.record.toString())
				.map((edge) => graph.getEdgeAttributes(edge))
				.map((edge) => edge.record.tb);

			const existingSet = new Set(existing);

			return {
				from: edges.from.filter((from) => !existingSet.has(from)),
				to: edges.to.filter((to) => !existingSet.has(to)),
			};
		},
	});

	return (
		<>
			<Group wrap="nowrap">
				<NodeCircle color={node.color} />
				<Box>
					<Text
						c="bright"
						fw={600}
					>
						{node.record.tb}
					</Text>
					<Text
						fz="xs"
						truncate
						mt={-2}
						c="slate.2"
						pr="md"
					>
						{node.record.id.toString()}
					</Text>
				</Box>
			</Group>
			<ContextMenuDivider />
			<ContextMenuItem
				title="Inspect"
				icon={<Icon path={iconSearch} />}
				onHide={onHideMenu}
				onClick={() => inspect(node.record)}
			/>
			<ContextMenuDivider />
			<ContextMenuItem
				title="Hide record"
				icon={<Icon path={iconEyeOff} />}
				onHide={onHideMenu}
				onClick={() => onHideNode?.(node.record)}
			/>
			<ContextMenuItem
				title="Copy record id"
				icon={<Icon path={iconCopy} />}
				onHide={onHideMenu}
				onClick={() => navigator.clipboard.writeText(node.record.toString())}
			/>
			{isSuccess && data.from.length > 0 && (
				<>
					<ContextMenuDivider />
					{data.from.map((from) => (
						<ContextMenuItem
							key={from}
							onHide={onHideMenu}
							onClick={() =>
								onExpandNode?.({ record: node.record, direction: "<-", edge: from })
							}
							title={
								<Group gap="xs">
									Expand incoming
									<Text
										fw={600}
										ff="mono"
									>
										{from}
									</Text>
								</Group>
							}
							icon={
								<Icon
									path={iconChevronRight}
									flip="horizontal"
								/>
							}
						/>
					))}
				</>
			)}

			{isSuccess && data.to.length > 0 && (
				<>
					<ContextMenuDivider />
					{data.to.map((to) => (
						<ContextMenuItem
							key={to}
							onHide={onHideMenu}
							icon={<Icon path={iconChevronRight} />}
							onClick={() =>
								onExpandNode?.({ record: node.record, direction: "->", edge: to })
							}
							title={
								<Group gap="xs">
									Expand outgoing
									<Text
										fw={600}
										ff="mono"
									>
										{to}
									</Text>
								</Group>
							}
						/>
					))}
				</>
			)}
		</>
	);
}
