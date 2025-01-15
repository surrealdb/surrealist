import { Box, Text } from "@mantine/core";
import { ContextMenuDivider, ContextMenuItem } from "mantine-contextmenu";
import { iconSearch, iconEyeOff, iconCopy, iconRelation, iconChevronRight } from "~/util/icons";
import { Icon } from "../Icon";
import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "~/screens/surrealist/connection/connection";
import { Gap, PreparedQuery, RecordId, StringRecordId } from "surrealdb";

const RECORD = new Gap<StringRecordId>();
const QUERY = new PreparedQuery(
	"SELECT VALUE (<->?).map(|$id| $id.tb()).distinct() FROM ONLY $record",
	{ record: RECORD },
);

export interface NodeContextMenuProps {
	node: string;
	inspect: (node: string) => void;
	onHideNode?: (node: string) => void;
	onHideMenu: () => void;
}

export function NodeContextMenu({ node, inspect, onHideNode, onHideMenu }: NodeContextMenuProps) {
	const { data } = useQuery({
		queryKey: ["graph-relation", node],
		enabled: true,
		queryFn: async () => {
			const [result] = await executeQuery(QUERY, [RECORD.fill(new StringRecordId(node))]);

			return result.success
				? (result.result as { from: string[]; to: string[] })
				: { from: [], to: [] };
		},
	});

	return (
		<>
			<Box
				ff="mono"
				c="bright"
				px="md"
			>
				{node}
			</Box>
			<ContextMenuDivider />
			<ContextMenuItem
				title="Inspect"
				icon={<Icon path={iconSearch} />}
				onHide={onHideMenu}
				onClick={() => inspect(node)}
			/>
			<ContextMenuDivider />
			<ContextMenuItem
				title="Hide record"
				icon={<Icon path={iconEyeOff} />}
				onHide={onHideMenu}
				onClick={() => onHideNode?.(node)}
			/>
			<ContextMenuItem
				title="Copy record id"
				icon={<Icon path={iconCopy} />}
				onHide={onHideMenu}
				onClick={() => {
					navigator.clipboard.writeText(node);
				}}
			/>
			<ContextMenuDivider />
			{data ? (
				<>
					{data.from.map((from) => (
						<ContextMenuItem
							key={from}
							title={from}
							onHide={onHideMenu}
							icon={
								<Icon
									path={iconChevronRight}
									flip="horizontal"
								/>
							}
							// onClick={() => inspect(from)}
						/>
					))}
					{data.to.map((from) => (
						<ContextMenuItem
							key={from}
							title={from}
							icon={<Icon path={iconChevronRight} />}
							onHide={onHideMenu}
							// onClick={() => inspect(from)}
						/>
					))}
				</>
			) : (
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
