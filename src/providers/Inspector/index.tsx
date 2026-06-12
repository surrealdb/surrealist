import { noop } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { RecordId } from "surrealdb";
import { type HistoryHandle, useHistory } from "~/hooks/history";
import { useStable } from "~/hooks/stable";
import { getSurrealQL } from "~/screens/surrealist/pages/Connection/connection/connection";
import { tagEvent } from "~/util/analytics";
import { RecordsChangedEvent } from "~/util/global-events";
import { InspectorDrawer } from "./drawer";

type InspectFunction = (record: RecordId | string) => Promise<void>;
type CreateFunction = (table?: string, content?: any) => void;
type StopInspectFunction = () => void;

export interface CreateState {
	table: string;
	content?: any;
}

const InspectorContext = createContext<{
	history: HistoryHandle<RecordId>;
	inspect: InspectFunction;
	create: CreateFunction;
	stopInspect: StopInspectFunction;
} | null>(null);

/**
 * Access the inspect function
 */
export function useInspector() {
	const ctx = useContext(InspectorContext);

	return (
		ctx ?? {
			history: [],
			inspect: noop,
			create: noop,
			stopInspect: noop,
		}
	);
}

export function InspectorProvider({ children }: PropsWithChildren) {
	const [historyItems, setHistoryItems] = useState<RecordId[]>([]);
	const [createState, setCreateState] = useState<CreateState | null>(null);
	const [isInspecting, isInspectingHandle] = useDisclosure();

	const history = useHistory({
		history: historyItems,
		setHistory: setHistoryItems,
	});

	const inspect = useStable(async (record: RecordId | string) => {
		const recordId =
			typeof record === "string"
				? await getSurrealQL().parseValue(record)
				: new RecordId(record.table, record.id);

		if (!(recordId instanceof RecordId)) {
			throw new TypeError("Invalid record id");
		}

		setCreateState(null);
		isInspectingHandle.open();

		if (isInspecting) {
			history.push(recordId);
		} else {
			setHistoryItems([recordId]);
		}

		tagEvent("record_inspector_open");
	});

	const create = useStable((table?: string, content?: any) => {
		const resolvedTable =
			table ?? (content?.id instanceof RecordId ? content.id.table.name : undefined);

		if (!resolvedTable) {
			throw new TypeError("Table required for record creation");
		}

		setHistoryItems([]);
		setCreateState({ table: resolvedTable, content });
		isInspectingHandle.open();

		tagEvent("record_creator_open");
	});

	const stopInspect = useStable(() => {
		setCreateState(null);
		isInspectingHandle.close();
	});

	const dispatchEvent = useStable(() => {
		RecordsChangedEvent.dispatch(null);
	});

	return (
		<InspectorContext.Provider value={{ history, inspect, create, stopInspect }}>
			{children}

			<InspectorDrawer
				opened={isInspecting}
				history={history}
				createState={createState}
				onClose={stopInspect}
				onRefresh={dispatchEvent}
			/>
		</InspectorContext.Provider>
	);
}
