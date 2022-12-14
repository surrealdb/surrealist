import type { editor } from "monaco-editor";
import { Divider, Group, ScrollArea, Stack, Text, useMantineTheme } from "@mantine/core";
import { mdiCodeJson } from "@mdi/js";
import { useMemo, useRef } from "react";
import { useStoreValue } from "~/store";
import { Panel } from "../Panel";
import { Spacer } from "../Scaffold/Spacer";
import Editor, { Monaco } from "@monaco-editor/react";
import { useStable } from "~/hooks/stable";

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
			readOnly: true,
			scrollBeyondLastLine: false,
			overviewRulerLanes: 0,
			fontFamily: 'JetBrains Mono',
			renderLineHighlight: 'none',
			lineDecorationsWidth: 12,
			lineNumbersMinChars: 1,
			glyphMargin: false,
			theme: 'surrealist',
			wordWrap: 'on',
			wrappingStrategy: 'advanced',
			minimap: {
				enabled: false
			}
		}
	}, []);

	return (
		<Editor
			onMount={setEditor}
			defaultLanguage="json"
			value={contents}
			options={options}
			theme="surrealist"
		/>
	)
}

export function ResultPane() {
	const results = useStoreValue(state => state.results);

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