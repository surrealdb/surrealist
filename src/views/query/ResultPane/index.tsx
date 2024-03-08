import { Box, Button, Center, Divider, Group, Pagination, Select, Stack, Text } from "@mantine/core";
import { useIsLight } from "~/hooks/theme";
import { useState } from "react";
import { useLayoutEffect } from "react";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { DataTable } from "~/components/DataTable";
import { RESULT_MODES } from "~/constants";
import { CombinedJsonPreview, LivePreview, SingleJsonPreview } from "./preview";
import { useConfigStore } from "~/stores/config";
import { useInterfaceStore } from "~/stores/interface";
import { ResultMode, TabQuery } from "~/types";
import { useStable } from "~/hooks/stable";
import { getSurreal } from "~/util/surreal";
import { iconBroadcastOff, iconCursor, iconHelp, iconQuery } from "~/util/icons";
import { executeQuery } from "~/database";
import { SelectionRange } from "@codemirror/state";

function computeRowCount(response: any) {
	if (!response) {
		return 0;
	}

	// We can count an array, otherwise it's always 1 result (unless there is an error, in which case there is no result :D)
	if (Array.isArray(response.result)) {
		return response.result.length;
	}

	return response.success ? 1 : 0;
}

export interface ResultPaneProps {
	activeTab: TabQuery;
	isQueryValid: boolean;
	selection: SelectionRange | undefined;
}

export function ResultPane({
	activeTab,
	isQueryValid,
	selection,
}: ResultPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();

	const liveTabs = useInterfaceStore((s) => s.liveTabs);

	const isLight = useIsLight();
	const [resultTab, setResultTab] = useState<number>(1);
	const resultMode = activeTab.resultMode;
	const responses = activeTab.response;
	const response = responses[resultTab - 1];

	const responseCount = responses.length;
	const rowCount = computeRowCount(response);

	const showCombined = resultMode == 'combined' || resultMode == "live";
	const showTabs = !showCombined && responses.length > 1;
	const showResponses = showCombined && responseCount > 0;
	const showTime = response?.execution_time && !showCombined;

	const isLive = liveTabs.has(activeTab.id);

	const cancelQueries = useStable(() => {
		getSurreal()?.cancelQueries(activeTab.id);
	});

	const setResultMode = (mode: ResultMode) => {
		updateQueryTab({
			id: activeTab.id,
			resultMode: mode
		});
	};

	const runQuery = useStable(() => {
		if (selection?.empty === false) {
			executeQuery({
				override: activeTab.query.slice(selection.from, selection.to)
			});
		} else {
			executeQuery();
		}
	});

	useLayoutEffect(() => {
		setResultTab(1);
	}, [responses.length]);

	const modeIcon = RESULT_MODES.find(r => r.value == resultMode)?.icon ?? iconHelp;

	const statusText = (showResponses
		? `${responseCount} ${responseCount == 1 ? 'response' : 'responses'}`
		: `${rowCount} ${rowCount == 1 ? 'result' : 'results'} ${showTime ? ` in ${response.execution_time}` : ''}`);

	const panelTitle = resultMode == 'combined'
		? 'Results'
		: resultMode == 'live'
			? "Live Messages"
			: showTabs
				? `Result #${resultTab}`
				: "Result";

	return (
		<ContentPane
			title={panelTitle}
			icon={iconQuery}
			rightSection={
				<Group align="center">
					{resultMode == "live" ? (isLive && (
						<Button
							onClick={cancelQueries}
							color="red"
							variant="light"
							size="xs"
							leftSection={
								<Icon path={iconBroadcastOff} />
							}
						>
							Stop listening
						</Button>
					)) : (
						<Text c={isLight ? "slate.5" : "slate.2"}>
							{statusText}
						</Text>
					)}

					<Divider orientation="vertical" />

					<Select
						data={RESULT_MODES}
						value={resultMode}
						onChange={setResultMode as any}
						w={130}
						styles={{
							input: {
								height: 34,
								minHeight: 0
							}
						}}
						leftSection={
							<Icon path={modeIcon} />
						}
					/>

					<Button
						size="xs"
						radius="xs"
						onClick={runQuery}
						color={isQueryValid ? "surreal" : "red"}
						variant={isQueryValid ? "gradient" : "filled"}
						style={{ border: "none" }}
						rightSection={
							<Icon path={iconCursor} />
						}
					>
						Run {selection?.empty === false ? 'selection' : 'query'}
					</Button>
				</Group>
			}
		>
			{(resultMode == "live") ? (
				<LivePreview
					query={activeTab}
					isLive={isLive}
				/>
			) : response ? (
				<>
					{resultMode == "combined" ? (
						<CombinedJsonPreview results={responses} />
					) : response.success ? (response.result?.length === 0 ? (
						<Text c="slate" flex={1}>
							No results found for query
						</Text>
					) : resultMode == "table" ? (
						<Box
							mih={0}
							flex={1}
							pos="relative"
						>
							<DataTable data={response.result} />
						</Box>
					) : (
						<SingleJsonPreview result={response.result} />
					)) : (
						<Text c="red" ff="mono" style={{ whiteSpace: "pre-wrap" }}>
							{response.result}
						</Text>
					)}
				</>
			) : (
				<Center h="100%" c="slate">
					<Stack>
						<Icon
							path={iconQuery}
							mx="auto"
							size="lg"
						/>
						Execute a query to view the results here
					</Stack>
				</Center>
			)}

			{showTabs && (
				<Stack gap="xs" align="center">
					<Divider w="100%" />
					<Pagination total={responses.length} value={resultTab} onChange={setResultTab} />
				</Stack>
			)}
		</ContentPane>
	);
}
