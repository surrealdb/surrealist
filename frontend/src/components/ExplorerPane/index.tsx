import { ActionIcon, ScrollArea } from "@mantine/core";
import { mdiRefresh, mdiTableSearch } from "@mdi/js";
import { useEffect } from "react";
import { useImmer } from "use-immer";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/surreal";
import { DataTable } from "../DataTable";
import { Icon } from "../Icon";
import { Panel } from "../Panel";

export interface ExplorerPaneProps {
	activeTable: string | null;
}

export function ExplorerPane(props: ExplorerPaneProps) {
	const [records, setRecords] = useImmer<any[]>([]);

	const fetchRecords = useStable(async () => {
		if (!props.activeTable) {
			setRecords([]);
			return;
		}

		const surreal = getSurreal();

		if (!surreal) {
			return;
		}

		const response = await surreal.query(`SELECT * FROM ${props.activeTable}`);
		const result = response[0].result;

		setRecords(result);
	});

	useEffect(() => {
		fetchRecords();
	}, [props.activeTable]);

	return (
		<Panel
			title="Data Explorer"
			icon={mdiTableSearch}
			rightSection={
				<ActionIcon
					title="Refresh"
					onClick={fetchRecords}
				>
					<Icon color="light.4" path={mdiRefresh} />
				</ActionIcon>
			}
		>
			<ScrollArea
				style={{ position: 'absolute', inset: 12, top: 0 }}
			>
				<DataTable
					data={records}
				/>
			</ScrollArea>
		</Panel>
	)
}