import type { editor } from "monaco-editor";
import { Divider, Group, ScrollArea, Stack, Text } from "@mantine/core";
import { mdiCodeJson } from "@mdi/js";
import { useMemo } from "react";
import { Panel } from "../Panel";
import { Spacer } from "../Scaffold/Spacer";
import Editor from "@monaco-editor/react";
import { useStable } from "~/hooks/stable";
import { baseEditorConfig } from "~/util/editor";
import { useActiveTab } from "~/hooks/tab";
import { useIsLight } from "~/hooks/theme";

interface DurationProps {
	time: string;
}

function Duration(props: DurationProps) {
	return (
		<Text color="light.4" lineClamp={1}>
			Query took {props.time}
		</Text>
	)
}

interface PreviewProps {
	result: any;
}

function Preview(props: PreviewProps) {
	const isLight = useIsLight();
	
	const setEditor = useStable((editor: editor.IStandaloneCodeEditor) => {
		let ignoreEvent = false;

		const updateHeight = () => {
			if (ignoreEvent) return;

			const container = editor.getContainerDomNode();
			const contentHeight = editor.getContentHeight();

			container.style.height = `${contentHeight}px`;
			
			try {
				ignoreEvent = true;
				editor.layout();
			} finally {
				ignoreEvent = false;
			}
		};

		editor.onDidContentSizeChange(updateHeight);
	});

	const contents = useMemo(() => {
		return JSON.stringify(props.result, null, 4);
	}, [props.result]);

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			...baseEditorConfig,
			readOnly: true,
			wordWrap: 'off',
		}
	}, []);

	return (
		<Editor
			onMount={setEditor}
			theme={isLight ? 'surrealist' : 'surrealist-dark'}
			defaultLanguage="json"
			value={contents}
			options={options}
		/>
	)
}

export function ResultPane() {
	const activeTab = useActiveTab();
	const results = activeTab?.lastResponse || [];

	return (
		<Panel
			title="Result"
			icon={mdiCodeJson}
			rightSection={results.length == 1 && <Duration time={results[0].time} />}
		>
			<ScrollArea
				style={{
					position: 'absolute',
					insetBlock: 0,
					insetInline: 24
				}}
			>
				<Stack spacing="lg">
					{results.map((result: any, index: number) => (
						<div key={index}>
							{results.length > 1 && (
								<>
									<Group>
										<Text weight={700}>
											Query {index + 1}
										</Text>
										<Spacer />
										<Duration time={result.time} />
									</Group>
									<Divider mb="xs" />
								</>
							)}
							{result.status == 'ERR' ? (
								<Text color="red">
									{result.detail}
								</Text>
							) : result.result?.length > 0 ? (
								<Text ff="monospace">
									<Preview result={result.result} />
								</Text>
							) : (
								<Text color="light.4">
									No results found for query
								</Text>
							)}
						</div>
					))}
				</Stack>
			</ScrollArea>
		</Panel>
	)
}