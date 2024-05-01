import { useDisclosure } from "@mantine/hooks";
import { createContext, useContext, PropsWithChildren, useState } from "react";
import { HistoryHandle, useHistory } from "~/hooks/history";
import { useStable } from "~/hooks/stable";
import { InspectorDrawer } from "./drawer";
import { RecordsChangedEvent } from "~/util/global-events";
import { RecordId } from "surrealdb.js";
import { parseValue } from "~/util/surrealql";

type InspectFunction = (record: RecordId | string) => void;
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

	return ctx ?? {
		history: [],
		inspect: () => {},
		stopInspect: () => {}
	};
}

export function InspectorProvider({ children }: PropsWithChildren) {
	const [historyItems, setHistoryItems] = useState<RecordId[]>([]);
	const [isInspecting, isInspectingHandle] = useDisclosure();

	const history = useHistory({
		history: historyItems,
		setHistory: setHistoryItems
	});

	const inspect = useStable((record: RecordId | string) => {
		if (typeof record === "string") {
			record = parseValue(record);

			if (!(record instanceof RecordId)) {
				throw new TypeError("Invalid record id");
			}
		}

		isInspectingHandle.open();

		if (isInspecting) {
			history.push(record);
		} else {
			setHistoryItems([record]);
		}
	});

	const stopInspect = useStable(() => {
		isInspectingHandle.close();
	});

	const dispatchEvent = useStable(() => {
		RecordsChangedEvent.dispatch(null);
	});

	return (
		<InspectorContext.Provider value={{history, inspect, stopInspect}}>
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