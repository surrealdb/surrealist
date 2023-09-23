import { mdiTune } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/environment";
import { actions, store, useStoreValue } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "~/components/Panel";
import { useState } from "react";
import { Text } from "@mantine/core";
import { SurrealistEditor } from "~/components/SurrealistEditor";

export function VariablesPane() {
	const activeTab = useActiveTab();
	const fontZoomLevel = useStoreValue((state) => state.config.fontZoomLevel);

	if (!activeTab) {
		throw new Error("This should not happen");
	}

	const [isInvalid, setIsInvalid] = useState(false);

	const setVariables = useStable((content: string | undefined) => {
		try {
			const json = content || "{}";
			const parsed = JSON.parse(json);

			if (typeof parsed !== "object" || Array.isArray(parsed)) {
				throw new TypeError("Invalid JSON");
			}

			store.dispatch(
				actions.updateTab({
					id: activeTab.id,
					variables: json,
				})
			);

			updateConfig();
			setIsInvalid(false);
		} catch {
			setIsInvalid(true);
		}
	});

	const jsonAlert = isInvalid ? <Text color="red">Invalid variable JSON</Text> : undefined;

	return (
		<Panel title="Variables" icon={mdiTune} rightSection={jsonAlert}>
			<SurrealistEditor
				language="json"
				value={activeTab?.variables?.toString()}
				onChange={setVariables}
				style={{
					position: "absolute",
					insetBlock: 0,
					insetInline: 24,
				}}
				options={{
					wrappingStrategy: "advanced",
					wordWrap: "on",
					suggest: {
						showProperties: false,
					},
					fontSize: 14 * fontZoomLevel,
				}}
			/>
		</Panel>
	);
}
