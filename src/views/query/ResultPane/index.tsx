import type { editor } from "monaco-editor";
import { ActionIcon, Center, Divider, Group, Pagination, Stack, Text } from "@mantine/core";
import { mdiClock, mdiCodeJson, mdiDatabase, mdiLightningBolt, mdiTable } from "@mdi/js";
import { useMemo } from "react";
import Editor from "@monaco-editor/react";
import { baseEditorConfig } from "~/util/editor";
import { useActiveTab } from "~/hooks/environment";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { useLayoutEffect } from "react";
import { actions, store, useStoreValue } from "~/store";
import { useStable } from "~/hooks/stable";
import { Icon } from "~/components/Icon";
import { Panel } from "~/components/Panel";
import { DataTable } from "~/components/DataTable";

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
		};
	}, [wordWrap]);

	return (
		<Editor
			theme={isLight ? 'surrealist' : 'surrealist-dark'}
			defaultLanguage="json"
			value={contents}
			options={options}
		/>
	);
}

export function ResultPane() {
	const isLight = useIsLight();
	const activeTab = useActiveTab();
	const resultListing = useStoreValue(state => state.config.resultListing);
	const results = activeTab?.lastResponse || [];

	const [resultTab, setResultTab] = useState<number>(1);
	const result = results[resultTab - 1];
	const showTabs = results.length > 1;

	useLayoutEffect(() => {
		setResultTab(1);
	}, [results.length]);

	const toggleResultView = useStable(() => {
		const newMode = resultListing == 'table' ? 'json' : 'table';

		store.dispatch(actions.setResultListingMode(newMode));
	});

	const listingIcon = resultListing == 'table' ? mdiCodeJson : mdiTable;
	const listingTitle = resultListing == 'table' ? 'Switch to JSON view' : 'Switch to table view';

	const showDivider = result?.result?.length > 0 || result?.time;

	return (
		<Panel
			title={showTabs ? `Result #${resultTab}` : 'Result'}
			icon={mdiLightningBolt}
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

							{showDivider && (
								<Divider
									orientation="vertical"
									color={isLight ? 'light.0' : 'dark.5'}
								/>
							)}
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
			<div
				style={{
					position: 'absolute',
					insetInline: 14,
					top: 0,
					bottom: showTabs ? 72 : 0
				}}
			>
				{result ? (
					<>
						{result.status == 'ERR' ? (
							<Text color="red">
								{result.detail}
							</Text>
						) : (result.result?.length === 0 ? (
							<Text color="light.4">
								No results found for query
							</Text>
						) : resultListing == 'table' ? (
							<DataTable data={result.result} />
						) : (
							<JsonPreview result={result.result} />
						))}
					</>
				) : (
					<Center h="100%" c="light.5">
						Execute a query to view the results
					</Center>
				)}
			</div>

			{showTabs && (
				<Stack
					spacing="xs"
					align="center"
					style={{
						position: 'absolute',
						insetInline: 14,
						bottom: 12
					}}
				>
					<Divider
						w="100%"
						color={isLight ? 'light.0' : 'dark.5'}
					/>
					<Pagination
						total={results.length}
						page={resultTab}
						onChange={setResultTab}
					/>
				</Stack>
			)}
		</Panel>
	);
}