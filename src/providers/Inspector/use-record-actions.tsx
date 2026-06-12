import { Text } from "@mantine/core";
import { RecordId } from "surrealdb";
import { useConnectionAndView, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useConfirmation } from "~/providers/Confirmation";
import {
	executeQuery,
	executeQueryFirst,
	getSurrealQL,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import { useConfigStore } from "~/stores/config";
import { showInfo, writeClipboardText } from "~/util/helpers";
import { useInspector } from ".";

export interface UseRecordActionsOptions {
	onDeleted?: (id: RecordId) => void;
	onRefresh?: () => void;
	onError: (error: string) => void;
}

export function useRecordActions(options: UseRecordActionsOptions) {
	const { create } = useInspector();
	const { addQueryTab } = useConfigStore.getState();
	const [connection] = useConnectionAndView();
	const navigateConnection = useConnectionNavigator();

	const copyRecordId = useStable(async (id: RecordId) => {
		const formatted = getSurrealQL().formatValue(id);

		writeClipboardText(formatted);

		formatted.then((value) => {
			showInfo({
				title: "Record ID copied",
				subtitle: `Copied ${value}`,
			});
		});
	});

	const copyRecordJson = useStable(async (id: RecordId) => {
		const content = await executeQueryFirst("SELECT * FROM ONLY $id", { id });

		writeClipboardText(getSurrealQL().formatValue(content ?? { id }, true, true));

		const formatted = await getSurrealQL().formatValue(id);

		showInfo({
			title: "Record contents copied",
			subtitle: `Copied ${formatted}`,
		});
	});

	const openQuery = useStable(async (id: RecordId, prefix: string) => {
		if (!connection) return;

		const formatted = await getSurrealQL().formatValue(id);

		navigateConnection(connection, "query");
		addQueryTab(connection, {
			type: "config",
			query: `${prefix} ${formatted}`,
		});
	});

	const duplicateRecord = useStable(async (id: RecordId) => {
		const content = await executeQueryFirst("SELECT * FROM ONLY $id", { id });

		create(id.table.name, content ?? { id });
	});

	const confirmDelete = useConfirmation<RecordId>({
		message: (id) => (
			<Text
				lineClamp={3}
				className="selectable"
			>
				You are about to delete the record{" "}
				<Text
					span
					c="bright"
					fw={600}
					ff="monospace"
				>
					{id.toString()}
				</Text>{" "}
				and all associated data.
			</Text>
		),
		confirmText: "Delete record",
		verification: "delete",
		skippable: true,
		onConfirm: async (id) => {
			const [{ success, result }] = await executeQuery(
				/* surql */ `DELETE ${await getSurrealQL().formatValue(id)}`,
			);

			if (!success) {
				options.onError(result.replace("There was a problem with the database: ", ""));
				return;
			}

			options.onDeleted?.(id);
			options.onRefresh?.();
		},
	});

	const deleteRecord = useStable((id: RecordId) => {
		confirmDelete(id);
	});

	return {
		duplicateRecord,
		copyRecordId,
		copyRecordJson,
		openQuery,
		deleteRecord,
	};
}
