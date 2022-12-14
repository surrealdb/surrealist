import { editor } from "monaco-editor";
import { mdiTune } from "@mdi/js";
import Editor from "@monaco-editor/react";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/tab";
import { actions, store } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "../Panel";
import { useMemo, useState } from "react";
import { baseEditorConfig } from "~/util/editor";
import { Text } from "@mantine/core";

export function VariablesPane() {
	const activeTab = useActiveTab();

	if (!activeTab) {
		throw new Error('This should not happen');
	}

	const [isInvalid, setIsInvalid] = useState(false);

	const setVariables = useStable((content: string | undefined) => {
		try {
			const json = content || '{}';
			const parsed = JSON.parse(json);

			if (typeof parsed !== 'object' || Array.isArray(parsed)) {
				throw new Error();
			}

			store.dispatch(actions.updateTab({
				id: activeTab.id,
				variables: json
			}));

			updateConfig();
			setIsInvalid(false);
		} catch {
			setIsInvalid(true);
		}
	});

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			...baseEditorConfig,
			wrappingStrategy: 'advanced',
			wordWrap: 'on',
			suggest: {
				showProperties: false
			}
		}
	}, []);

	const jsonAlert = isInvalid
		? <Text color="red">Invalid variable JSON</Text>
		: undefined;

	return (
		<Panel
			title="Variables"
			icon={mdiTune}
			rightSection={jsonAlert}
		>
			<div
				style={{
					position: 'absolute',
					insetBlock: 0,
					insetInline: 24
				}}
			>
				<Editor
					value={activeTab?.variables?.toString()}
					onChange={setVariables}
					options={options}
					theme="surrealist"
					language="json"
				/>
			</div>
		</Panel>
	)
}