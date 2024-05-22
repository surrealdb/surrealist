import { useConfigStore } from "~/stores/config";
import { getActiveQuery } from "./connection";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import { ResultMode } from "~/types";
import { RESULT_MODES } from "~/constants";
import { executeQuery, executeUserQuery } from "~/connection";

/**
 * Handle incoming window messages
 */
export function handleWindowMessage(event: MessageEvent) {
	const data = event.data as any;

	if (typeof data !== "object" || !data.action) {
		return;
	}

	const options = (typeof data.options === "object")
		? data.options
		: {};

	const active = getActiveQuery()!;
	const { updateQueryTab } = useConfigStore.getState();
	const { clearQueryResponse } = useDatabaseStore.getState();
	const { setShowQueryVariables } = useInterfaceStore.getState();

	switch (data.action) {
		case "set_editor": {
			const { query, variables } = options;

			updateQueryTab({
				id: active.id,
				query: typeof query === "string" ? query : active.query,
				variables: typeof variables === "string" ? variables : active.variables
			});

			break;
		}
		case "clear_response": {
			clearQueryResponse(active.id);
			break;
		}
		case "set_editor_mode": {
			const { mode } = options;

			if (typeof mode !== "string") {
				return;
			}

			setShowQueryVariables(mode === "variables");
			break;
		}
		case "set_result_mode": {
			const { mode } = options;
			const available = RESULT_MODES.map((mode) => mode.value);

			if (typeof mode !== "string" || !available.includes(mode as any)) {
				return;
			}

			updateQueryTab({
				id: active.id,
				resultMode: mode as ResultMode
			});
			break;
		}
		case "run_query": {
			executeUserQuery();
			break;
		}
		case "execute_query": {
			const { query } = options;

			if (typeof query !== "string") {
				return;
			}

			executeQuery(query);
			break;
		}
	}
}