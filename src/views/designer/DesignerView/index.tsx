import { useEffect, useMemo } from "react";
import { TableGraphPane } from "../TableGraphPane";
import { useStable } from "~/hooks/stable";
import { useTables } from "~/hooks/schema";
import { useImmer } from "use-immer";
import { useSaveable } from "~/hooks/save";
import { buildDefinitionQueries, isSchemaValid } from "../DesignDrawer/helpers";
import { showError } from "~/util/helpers";
import { syncDatabaseSchema } from "~/util/schema";
import { TableInfo } from "~/types";
import { ReactFlowProvider } from "reactflow";
import { useIsConnected } from "~/hooks/connection";
import { useDisclosure } from "@mantine/hooks";
import { DesignDrawer } from "../DesignDrawer";
import { useIntent } from "~/hooks/url";
import { useViewEffect } from "~/hooks/view";
import { executeQuery } from "~/connection";

const DEFAULT_DEF: TableInfo = {
	schema: {
		name: "",
		drop: false,
		full: false,
		kind: {
			kind: "ANY"
		},
		permissions: {
			select: "",
			create: "",
			update: "",
			delete: ""
		}
	},
	fields: [],
	indexes: [],
	events: []
};

export interface DesignerViewProps {
}

export function DesignerView(_props: DesignerViewProps) {
	const isOnline = useIsConnected();
	const tables = useTables();

	const [isDesigning, isDesigningHandle] = useDisclosure();
	const [data, setData] = useImmer<TableInfo>(DEFAULT_DEF);

	const isValid = useMemo(() => {
		return data ? isSchemaValid(data) : true;
	}, [data]);

	const saveHandle = useSaveable({
		valid: isValid,
		track: {
			data
		},
		onSave({ data: previous }) {
			if (!previous) {
				throw new Error("Could not determine previous state");
			}

			const query = buildDefinitionQueries(previous, data!);

			executeQuery(query)
				.then(() => syncDatabaseSchema({
					tables: [data.schema.name]
				}))
				.then(isDesigningHandle.close)
				.catch((err) => {
					showError({
						title: "Failed to apply schema",
						subtitle: err.message
					});
				});
		},
		onRevert({ data }) {
			setData(data);
		}
	});

	const setActiveTable = useStable((table: string) => {
		const schema = tables.find((t) => t.schema.name === table);

		if (!schema) {
			throw new Error(`Could not find table ${table}`);
		}

		setData(schema);
		saveHandle.track();
		isDesigningHandle.open();
	});

	const closeDrawer = useStable((force?: boolean) => {
		if (saveHandle.isChanged && !force) {
			return;
		}

		isDesigningHandle.close();
	});

	useEffect(() => {
		if (!isOnline) {
			isDesigningHandle.close();
		}
	}, [isOnline]);

	useIntent("design-table", ({ table }) => {
		setActiveTable(table);
	});

	useViewEffect("designer", () => {
		syncDatabaseSchema();
	});

	return (
		<>
			<ReactFlowProvider>
				<TableGraphPane
					tables={tables}
					active={isDesigning ? data : null}
					setActiveTable={setActiveTable}
				/>
			</ReactFlowProvider>

			<DesignDrawer
				opened={isDesigning}
				onClose={closeDrawer}
				handle={saveHandle}
				value={data as any}
				onChange={setData as any}
			/>
		</>
		// </Splitter>
	);
}