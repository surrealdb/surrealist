import { noop } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { createContext, type PropsWithChildren, useContext, useState } from "react";
import { RecordId } from "surrealdb";
import { type HistoryHandle, useHistory } from "~/hooks/history";
import { useStable } from "~/hooks/stable";
import { getSurrealQL } from "~/screens/surrealist/connection/connection";
import { tagEvent } from "~/util/analytics";
import { RecordsChangedEvent } from "~/util/global-events";
import { InspectorDrawer } from "./drawer";

type InspectFunction = (record: RecordId | string) => Promise<void>;
type StopInspectFunction = () => void;

const InspectorContext = createContext<{
	history: HistoryHandle<RecordId>;
	inspect: InspectFunction;
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
			stopInspect: noop,
		}
	);
}

export function InspectorProvider({ children }: PropsWithChildren) {
	const [historyItems, setHistoryItems] = useState<RecordId[]>([]);
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

		isInspectingHandle.open();

		if (isInspecting) {
			history.push(recordId);
		} else {
			setHistoryItems([recordId]);
		}

		tagEvent("record_inspector_open");
	});

	const stopInspect = useStable(() => {
		isInspectingHandle.close();
	});

	const dispatchEvent = useStable(() => {
		RecordsChangedEvent.dispatch(null);
	});

	return (
		<InspectorContext.Provider value={{ history, inspect, stopInspect }}>
			{children}

			<InspectorDrawer
				opened={isInspecting}
				history={history}
				onClose={isInspectingHandle.close}
				onRefresh={dispatchEvent}
			/>
		</InspectorContext.Provider>
	);
}
