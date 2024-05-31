import { useDisclosure } from "@mantine/hooks";
import { useEffect, useMemo } from "react";
import { ReactFlowProvider } from "reactflow";
import { useImmer } from "use-immer";
import { executeQuery } from "~/connection";
import { useIsConnected } from "~/hooks/connection";
import { useSaveable } from "~/hooks/save";
import { useTables } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { useIntent } from "~/hooks/url";
import { useViewEffect } from "~/hooks/view";
import { TableInfo } from "~/types";
import { showError } from "~/util/helpers";
import { syncDatabaseSchema } from "~/util/schema";
import { DesignDrawer } from "../DesignDrawer";
import { buildDefinitionQueries, isSchemaValid } from "../DesignDrawer/helpers";
import { TableGraphPane } from "../TableGraphPane";

const DEFAULT_DEF: TableInfo = {
	schema: {
		name: "",
		drop: false,
		full: false,
		kind: {
			kind: "ANY",
		},
		permissions: {
			select: "",
			create: "",
			update: "",
			delete: "",
		},
	},
	fields: [],
	indexes: [],
	events: [],
};

export interface DesignerViewProps {}

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
			data,
		},
		onSave({ data: previous }) {
			if (!previous) {
				throw new Error("Could not determine previous state");
			}

			const query = buildDefinitionQueries(previous, data!);

			executeQuery(query)
				.then(() =>
					syncDatabaseSchema({
						tables: [data.schema.name],
					}),
				)
				.then(isDesigningHandle.close)
				.catch((err) => {
					showError({
						title: "Failed to apply schema",
						subtitle: err.message,
					});
				});
		},
		onRevert({ data }) {
			setData(data);
		},
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
	}, [isOnline, isDesigningHandle]);

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

export default DesignerView;
