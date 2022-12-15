import type { editor } from "monaco-editor";
import { Group, Tabs, Text } from "@mantine/core";
import { mdiClock, mdiCodeJson, mdiTable } from "@mdi/js";
import { useMemo } from "react";
import { Panel } from "../Panel";
import Editor from "@monaco-editor/react";
import { baseEditorConfig } from "~/util/editor";
import { useActiveTab } from "~/hooks/tab";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { useLayoutEffect } from "react";
import { Icon } from "../Icon";

interface PreviewProps {
	result: any;
}

function Preview(props: PreviewProps) {
	const isLight = useIsLight();

	const contents = useMemo(() => {
		return JSON.stringify(props.result, null, 4);
	}, [props.result]);

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			...baseEditorConfig,
			readOnly: true,
			wordWrap: 'off'
		}
	}, []);

	return (
		<Editor
			theme={isLight ? 'surrealist' : 'surrealist-dark'}
			defaultLanguage="json"
			value={contents}
			options={options}
		/>
	)
}

export function ResultPane() {
	const activeTab = useActiveTab();
	const results = (activeTab?.lastResponse || []).map((res: any) => {
		return {
			...res,
			result: Array.isArray(res.result) ? res.result : [res.result]
		};
	});

	const [resultTab, setResultTab] = useState<string|null>(null);
	const result = results[parseInt(resultTab || '0')];
	const showTabs = results.length > 1;

	useLayoutEffect(() => {
		setResultTab(results.length > 0 ? '0' : null);
	}, [results.length]);

	return (
		<Panel
			title="Result"
			icon={mdiCodeJson}
			rightSection={
				<Group align="center">
					{result?.result?.length > 0 && (
						<>
							<Icon color="light.4" path={mdiTable} mr={-10} />
							<Text color="light.4" lineClamp={1}>
								{result.result.length} rows
							</Text>
						</>
					)}
					{result?.time && (
						<>
							<Icon color="light.4" path={mdiClock} mr={-10}  />
							<Text color="light.4" lineClamp={1}>
								{result.time}
							</Text>
						</>
					)}
				</Group>
			}
		>
			{showTabs && (
				<Tabs
					value={resultTab}
					onTabChange={setResultTab}
				>
					<Tabs.List>
						{results.map((_: any, i: number) => (
							<Tabs.Tab
								key={i}
								value={i.toString()}
							>
								Query {i + 1}
							</Tabs.Tab>
						))}
					</Tabs.List>
				</Tabs>
			)}
			<div
				style={{
					position: 'absolute',
					insetBlock: 0,
					insetInline: 24,
					top: showTabs ? 48 : 0
				}}
			>
				{result && (
					<>
						{result.status == 'ERR' ? (
							<Text color="red">
								{result.detail}
							</Text>
						) : result.result?.length > 0 ? (
							<Preview result={result.result} />
						) : (
							<Text color="light.4">
								No results found for query
							</Text>
						)}
					</>
				)}
			</div>
		</Panel>
	)
}