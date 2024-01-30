import { useEffect, useMemo, useState } from "react";
import { SplitValues, Splitter } from "~/components/Splitter";
import { DesignPane } from "../DesignPane";
import { TableGraphPane } from "../TableGraphPane";
import { useStable } from "~/hooks/stable";
import { useTables } from "~/hooks/schema";
import { useImmer } from "use-immer";
import { useSaveable } from "~/hooks/save";
import { buildDefinitionQueries, isSchemaValid } from "../DesignPane/helpers";
import { showError } from "~/util/helpers";
import { getActiveSurreal } from "~/util/connection";
import { fetchDatabaseSchema } from "~/util/schema";
import { TableDefinition } from "~/types";
import { ReactFlowProvider } from "reactflow";
import { useIsConnected } from "~/hooks/connection";

const SPLIT_SIZE: SplitValues = [undefined, 450];

export interface DesignerViewProps {
}

export function DesignerView(_props: DesignerViewProps) {
	const isOnline = useIsConnected();
	const tables = useTables();

	const [splitValues, setSplitValues] = useState<SplitValues>(SPLIT_SIZE);
	const [data, setData] = useImmer<TableDefinition | null>(null);

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
			const surreal = getActiveSurreal();

			surreal.query(query)
				.then(() => fetchDatabaseSchema())
				.catch((err) => {
					showError("Failed to apply schema", err.message);
				});
		},
		onRevert({ data }) {
			setData(data);
		}
	});

	const setActiveTable = useStable((table: string) => {
		if (saveHandle.isChanged) {
			showError("Unsaved changes", "You have unsaved changes. Please save or revert them before switching tables.");
			return;
		}

		const schema = tables.find((t) => t.schema.name === table);
		
		if (!schema) {
			throw new Error(`Could not find table ${table}`);
		}

		setData(schema);
		saveHandle.track();
	});

	const closeTable = useStable(() => {
		setData(null);
		saveHandle.track();
	});

	useEffect(() => {
		if (!isOnline) {
			closeTable();
		}
	}, [isOnline]);

	return (
		<Splitter
			minSize={SPLIT_SIZE}
			bufferSize={500}
			values={splitValues}
			onChange={setSplitValues}
			direction="horizontal"
			endPane={
				data && (
					<DesignPane
						value={data}
						onChange={setData as any}
						onClose={closeTable}
						handle={saveHandle}
					/>
				)
			}
		>
			<ReactFlowProvider>
				<TableGraphPane
					tables={tables}
					active={data}
					setActiveTable={setActiveTable}
				/>
			</ReactFlowProvider>
		</Splitter>
	);
}