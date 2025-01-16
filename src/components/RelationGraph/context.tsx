import { Box, Group, Text } from "@mantine/core";
import { ContextMenuDivider, ContextMenuItem } from "mantine-contextmenu";
import { iconSearch, iconEyeOff, iconCopy, iconRelation, iconChevronRight } from "~/util/icons";
import { Icon } from "../Icon";
import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { Gap, PreparedQuery, RecordId } from "surrealdb";
import { RelationGraphNode } from ".";
import { useInspector } from "~/providers/Inspector";
import { NodeCircle } from "./node";

const RECORD = new Gap<RecordId>();
const QUERY = new PreparedQuery(
	"SELECT (<-?).map(|$id| $id.tb()).distinct() AS from, (->?).map(|$id| $id.tb()).distinct() AS to FROM ONLY $record",
	{ record: RECORD },
);

export interface NodeContextMenuProps {
	node: RelationGraphNode;
	inspect: (record: RecordId) => void;
	onHideNode?: (node: string) => void;
	onHideMenu: () => void;
}

export function NodeContextMenu({ node, inspect, onHideNode, onHideMenu }: NodeContextMenuProps) {
	const id = node.record.toString();

	const { data, isSuccess } = useQuery({
		queryKey: ["graph-relation", node],
		enabled: true,
		queryFn: async () => {
			const [result] = await executeQuery(QUERY, [RECORD.fill(node.record)]);

			return result.success
				? (result.result as { from: string[]; to: string[] })
				: { from: [], to: [] };
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
				onClick={() => onHideNode?.(id)}
			/>
			<ContextMenuItem
				title="Copy record id"
				icon={<Icon path={iconCopy} />}
				onHide={onHideMenu}
				onClick={() => {
					navigator.clipboard.writeText(id);
				}}
			/>
			{isSuccess && data.from.length > 0 && (
				<>
					<ContextMenuDivider />
					{data.from.map((from) => (
						<ContextMenuItem
							key={from}
							onHide={onHideMenu}
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
							// onClick={() => inspect(from)}
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
							icon={<Icon path={iconChevronRight} />}
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
							onHide={onHideMenu}
							// onClick={() => inspect(from)}
						/>
					))}
				</>
			)}

			{isSuccess && data.from.length === 0 && data.to.length === 0 && (
				<ContextMenuItem
					title="No relationships found"
					icon={<Icon path={iconRelation} />}
					onHide={onHideMenu}
					disabled
				/>
			)}
		</>
	);
}
