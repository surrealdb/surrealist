import { Box, Group, Text } from "@mantine/core";
import { ContextMenuDivider, ContextMenuItem } from "mantine-contextmenu";
import { iconSearch, iconEyeOff, iconCopy, iconChevronRight, iconRelation } from "~/util/icons";
import { Icon } from "../Icon";
import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { Gap, PreparedQuery, RecordId } from "surrealdb";
import { NodeCircle } from "./node";
import { GraphEdges, GraphExpansion, RelationGraphNode } from "./types";
import { unique } from "radash";

type Edges = { from: string[]; to: string[] };

const RECORD = new Gap<RecordId>();
const QUERY = new PreparedQuery(
	"SELECT (<-?).map(|$id| $id.tb()).distinct() AS from, (->?).map(|$id| $id.tb()).distinct() AS to FROM ONLY $record",
	{ record: RECORD },
);

export interface NodeContextMenuProps {
	node: RelationGraphNode;
	inspect: (record: RecordId) => void;
	queryEdges: (record: RecordId) => GraphEdges;
	onExpandNode?: (expansion: GraphExpansion) => void;
	onHideNode?: (node: RecordId) => void;
	onHideMenu: () => void;
}

export function NodeContextMenu({
	node,
	inspect,
	queryEdges,
	onExpandNode,
	onHideNode,
	onHideMenu,
}: NodeContextMenuProps) {
	const { data, isSuccess } = useQuery({
		queryKey: ["graph-relation", node],
		enabled: true,
		queryFn: async () => {
			const { from: incoming, to: outgoing } = queryEdges(node.record);
			const [result] = await executeQuery(QUERY, [RECORD.fill(node.record)]);
			const edges: Edges = result.success ? result.result : { from: [], to: [] };

			return {
				from: edges.from.filter((from) => !incoming.has(from)),
				to: edges.to.filter((to) => !outgoing.has(to)),
			};
		},
	});

	const allEdges = isSuccess ? unique([...data.from, ...data.to]) : [];

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

			{isSuccess && (data.from.length > 0 || data.to.length > 0) && (
				<>
					<ContextMenuDivider />
					<ContextMenuItem
						onHide={onHideMenu}
						onClick={() =>
							onExpandNode?.({
								record: node.record,
								direction: "<->",
								edges: allEdges,
							})
						}
						title="Expand all relationships"
						icon={
							<Icon
								path={iconRelation}
								flip="horizontal"
							/>
						}
					/>
				</>
			)}

			{isSuccess &&
				data.from.length > 0 &&
				data.from.map((from) => (
					<ContextMenuItem
						key={from}
						onHide={onHideMenu}
						onClick={() =>
							onExpandNode?.({ record: node.record, direction: "<-", edges: [from] })
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

			{isSuccess &&
				data.to.length > 0 &&
				data.to.map((to) => (
					<ContextMenuItem
						key={to}
						onHide={onHideMenu}
						icon={<Icon path={iconChevronRight} />}
						onClick={() =>
							onExpandNode?.({ record: node.record, direction: "->", edges: [to] })
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
	);
}
