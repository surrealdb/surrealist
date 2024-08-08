import { useEffect, useMemo, useState } from "react";
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
import { useActiveConnection, useIsConnected } from "~/hooks/connection";
import { useDisclosure } from "@mantine/hooks";
import { DesignDrawer } from "../DesignDrawer";
import { useIntent } from "~/hooks/url";
import { useViewEffect } from "~/hooks/view";
import { executeQuery } from "~/screens/database/connection/connection";
import { PanelDragger } from "~/components/Pane/dragger";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Box } from "@mantine/core";
import { TablesPane } from "~/screens/database/components/TablesPane";
import { usePanelMinSize } from "~/hooks/panels";
import { iconDesigner } from "~/util/icons";

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

	const [errors, setErrors] = useState<string[]>([]);
	const [isDesigning, isDesigningHandle] = useDisclosure();
	const [data, setData] = useImmer<TableInfo>(DEFAULT_DEF);

	const { designerTableList } = useActiveConnection();

	const isValid = useMemo(() => {
		return data ? isSchemaValid(data) : true;
	}, [data]);

	const saveHandle = useSaveable({
		valid: isValid,
		track: {
			data
		},
		onSave: async ({ data: previous }) => {
			if (!previous) {
				throw new Error("Could not determine previous state");
			}

			const query = buildDefinitionQueries(previous, data!);

			try {
				const res = await executeQuery(query);
				const errors = res.flatMap((r) => {
					if (r.success) return [];

					return [
						(r.result as string).replace('There was a problem with the database: ', '')
					];
				});

				setErrors(errors);

				if (errors.length > 0) {
					return false;
				}

				syncDatabaseSchema({
					tables: [data.schema.name]
				});

				isDesigningHandle.close();
			} catch(err: any) {
				showError({
					title: "Failed to apply schema",
					subtitle: err.message
				});
			}
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
	}, [isOnline, isDesigningHandle]);

	useIntent("design-table", ({ table }) => {
		setActiveTable(table);
	});

	useViewEffect("designer", () => {
		syncDatabaseSchema();
	});

	const [minSize, ref] = usePanelMinSize(275);

	return (
		<>
			<Box h="100%" ref={ref}>
				<PanelGroup
					direction="horizontal"
					style={{ opacity: minSize === 0 ? 0 : 1 }}
				>
					{designerTableList && (
						<>
							<Panel
								defaultSize={minSize}
								minSize={minSize}
								maxSize={35}
								id="tables"
								order={1}
							>
								<TablesPane
									icon={iconDesigner}
									onTableSelect={setActiveTable}
								/>
							</Panel>
							<PanelDragger />
						</>
					)}
					<Panel minSize={minSize} order={2}>
						<ReactFlowProvider>
							<TableGraphPane
								tables={tables}
								active={isDesigning ? data : null}
								setActiveTable={setActiveTable}
							/>
						</ReactFlowProvider>
					</Panel>
				</PanelGroup>
			</Box>

			<DesignDrawer
				opened={isDesigning}
				onClose={closeDrawer}
				handle={saveHandle}
				errors={errors}
				value={data as any}
				onChange={setData as any}
			/>
		</>
		// </Splitter>
	);
}

export default DesignerView;