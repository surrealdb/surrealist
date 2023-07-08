import type { editor } from "monaco-editor";
import { mdiTune } from "@mdi/js";
import { useStable } from "~/hooks/stable";
import { useActiveTab } from "~/hooks/environment";
import { actions, store } from "~/store";
import { updateConfig } from "~/util/helpers";
import { Panel } from "~/components/Panel";
import { useMemo, useState } from "react";
import { baseEditorConfig, configureQueryEditor } from "~/util/editor";
import { Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import Editor from "@monaco-editor/react";

export interface VariablesPaneProps {
	onExecuteQuery: () => void;
}

export function VariablesPane(props: VariablesPaneProps) {
	const activeTab = useActiveTab();
	const isLight = useIsLight();

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

	const configure = useStable((editor: editor.IStandaloneCodeEditor) => {
		configureQueryEditor(editor, props.onExecuteQuery);
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
					onMount={configure}
					theme={isLight ? 'surrealist' : 'surrealist-dark'}
					value={activeTab?.variables?.toString()}
					onChange={setVariables}
					options={options}
					language="json"
				/>
			</div>
		</Panel>
	)
}