import classes from './style.module.scss';
import type { editor } from "monaco-editor";
import { ActionIcon, Divider, Group, ScrollArea, Table, Tabs, Text } from "@mantine/core";
import { mdiClock, mdiCodeJson, mdiDatabase, mdiTable } from "@mdi/js";
import { useMemo } from "react";
import { Panel } from "../Panel";
import Editor from "@monaco-editor/react";
import { baseEditorConfig } from "~/util/editor";
import { useActiveTab } from "~/hooks/tab";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { useLayoutEffect } from "react";
import { Icon } from "../Icon";
import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { propertyVisitor } from "~/util/visitor";

interface PreviewProps {
	result: any;
}

function JsonPreview({ result }: PreviewProps) {
	const isLight = useIsLight();
	const wordWrap = useStoreValue(state => state.config.wordWrap);

	const contents = useMemo(() => {
		return JSON.stringify(result, null, 4);
	}, [result]);

	const options = useMemo<editor.IStandaloneEditorConstructionOptions>(() => {
		return {
			...baseEditorConfig,
			readOnly: true,
			wordWrap: wordWrap ? 'on' : 'off'
		}
	}, [wordWrap]);

	return (
		<Editor
			theme={isLight ? 'surrealist' : 'surrealist-dark'}
			defaultLanguage="json"
			value={contents}
			options={options}
		/>
	)
}

function TablePreview({ result }: PreviewProps) {
	const [keys, values] = useMemo(() => {
		const keys: string[] = [];
		const values: any[] = [];
	
		if (Array.isArray(result)) {
			for (let i = 0; i < result.length; i++) {
				const row: any = {};
				
				propertyVisitor(result[i], (path, value) => {
					const pathName = path.join('.');
			
					if (!keys.includes(pathName)) {
						if (pathName === 'id') {
							keys.unshift(pathName);
						} else {
							keys.push(pathName);
						}
					}

					row[pathName] = value;
				});

				values.push(row);
			}
		}

		return [keys, values];
	}, [result]);

	const headers = useMemo(() => {
		const headers: any = [];

		keys.forEach(key => {
			headers.push(
				<th>{key}</th>
			);
		});
		
		return headers;
	}, [keys]);

	const rows = useMemo(() => {
		return values.map(value => {
			let hasId = false;

			const columns = Array.from(keys).map(key => {
				const text = value[key];

				if (!hasId) {
					hasId = true;

					return (
						<td>
							<Text c="surreal" ff="JetBrains Mono">
								{text}
							</Text>
						</td>
					);
				}

				if (text !== undefined) {
					return (
						<td>
							{text.toString()}
						</td>
					);
				} else {
					return (
						<td>
							<Text size="sm" color="light.5">
								&mdash;
							</Text>
						</td>
					);
				}
			});

			return (
				<tr>
					{columns}
				</tr>
			)
		});
	}, [keys, values]);

	if (!Array.isArray(result)) {
		return (
			<Text color="light.4">
				Result could not be displayed as a table.
			</Text>
		);
	}

	return (
		<div className={classes.tableContainer}>
			<ScrollArea className={classes.tableWrapper}>
				<Table
					striped
					onMouseDownCapture={e => e.stopPropagation()}
					className={classes.table}
				>
					<thead>
						<tr>
							{headers}
						</tr>
					</thead>
					<tbody>
						{rows}
					</tbody>
				</Table>
			</ScrollArea>
		</div>
	)
}

export function ResultPane() {
	const isLight = useIsLight();
	const activeTab = useActiveTab();
	const resultListing = useStoreValue(state => state.config.resultListing);
	const results = activeTab?.lastResponse || [];

	const [resultTab, setResultTab] = useState<string|null>(null);
	const result = results[parseInt(resultTab || '0')];
	const showTabs = results.length > 1;

	useLayoutEffect(() => {
		setResultTab(results.length > 0 ? '0' : null);
	}, [results.length]);

	const toggleResultView = useStable(() => {
		const newMode = resultListing == 'table' ? 'json' : 'table';

		store.dispatch(actions.setResultListingMode(newMode));
	});

	const listingIcon = resultListing == 'table' ? mdiCodeJson : mdiTable;
	const listingTitle = resultListing == 'table' ? 'Switch to JSON view' : 'Switch to table view';

	return (
		<Panel
			title="Result"
			icon={mdiCodeJson}
			rightSection={
				<Group align="center">
					{result?.result !== undefined && (
						<>
							<ActionIcon
								onClick={toggleResultView}
								title={listingTitle}
							>
								<Icon color="light.4" path={listingIcon} />
							</ActionIcon>

							<Divider
								orientation="vertical"
								color={isLight ? 'light.0' : 'dark.5'}
							/>
						</>
					)}

					{result?.result?.length > 0 && (
						<>
							<Icon color="light.4" path={mdiDatabase} mr={-10} />
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
					insetInline: 14,
					top: showTabs ? 48 : 0
				}}
			>
				{result && (
					<>
						{result.status == 'ERR' ? (
							<Text color="red">
								{result.detail}
							</Text>
						) : result.result?.length === 0 ? (
							<Text color="light.4">
								No results found for query
							</Text>
						) : resultListing == 'table' ? (
							<TablePreview result={result.result} />
						) : (
							<JsonPreview result={result.result} />
						)}
					</>
				)}
			</div>
		</Panel>
	)
}