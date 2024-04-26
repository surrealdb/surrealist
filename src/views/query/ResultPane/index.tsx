import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Center, Divider, Group, Menu, Pagination, Stack, Text, Tooltip } from "@mantine/core";
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
import { QueryResponse, ResultMode, TabQuery } from "~/types";
import { useStable } from "~/hooks/stable";
import { iconBroadcastOff, iconCursor, iconQuery } from "~/util/icons";
import { SelectionRange } from "@codemirror/state";
import { cancelLiveQueries } from "~/connection";
import { useDatabaseStore } from "~/stores/database";
import { isMini } from "~/adapter";

function computeRowCount(response: QueryResponse) {
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
	onRunQuery: () => void;
}

export function ResultPane({
	activeTab,
	isQueryValid,
	selection,
	onRunQuery,
}: ResultPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();

	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const responseMap = useDatabaseStore((s) => s.responses);

	const isLight = useIsLight();
	const [resultTab, setResultTab] = useState<number>(1);
	const resultMode = activeTab.resultMode;
	const responses = responseMap[activeTab.id] || [];
	const activeResponse = responses[resultTab - 1];

	const responseCount = responses.length;
	const rowCount = computeRowCount(activeResponse);

	const showCombined = resultMode == 'combined' || resultMode == "live";
	const showTabs = !showCombined && responses.length > 1;
	const showResponses = showCombined && responseCount > 0;
	const showTime = !showCombined && !!activeResponse?.execution_time;

	const isLive = liveTabs.has(activeTab.id);

	const cancelQueries = useStable(() => {
		cancelLiveQueries(activeTab.id);
	});

	const setResultMode = (mode: ResultMode) => {
		updateQueryTab({
			id: activeTab.id,
			resultMode: mode
		});
	};

	useLayoutEffect(() => {
		setResultTab(1);
	}, [responses.length]);

	const activeMode = RESULT_MODES.find(r => r.value == resultMode)!;
	const hasSelection = selection?.empty === false;

	const statusText = (showResponses
		? `${responseCount} ${responseCount == 1 ? 'response' : 'responses'}`
		: `${rowCount} ${rowCount == 1 ? 'result' : 'results'} ${showTime ? ` in ${activeResponse.execution_time}` : ''}`);

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
				<Group align="center" wrap="nowrap" className={classes.controls}>
					{resultMode == "live" ? (isLive && (
						<Button
							onClick={cancelQueries}
							color="pink.7"
							variant="light"
							size="xs"
							leftSection={
								<Icon path={iconBroadcastOff} />
							}
						>
							Stop listening
						</Button>
					)) : (
						<Text
							c={isLight ? "slate.5" : "slate.2"}
							className={classes.results}
						>
							{statusText}
						</Text>
					)}

					<Menu>
						<Menu.Target>
							{isMini ? (
								<Tooltip label="Click to change mode">
									<ActionIcon
										aria-label={`Change result mode. Currently ${activeMode}`}
										h={30}
										w={30}
									>
										<Icon path={activeMode.icon} />
									</ActionIcon>
								</Tooltip>
							) : (
								<Button
									size="xs"
									radius="xs"
									aria-label="Change result mode"
									color="slate"
									leftSection={<Icon path={activeMode.icon} />}
								>
									{activeMode.label}
								</Button>
							)}
						</Menu.Target>
						<Menu.Dropdown>
							{RESULT_MODES.map(({ label, value, icon }) => (
								<Menu.Item
									key={value}
									onClick={() => setResultMode(value)}
									leftSection={<Icon path={icon} />}
								>
									{label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>

					<Button
						size="xs"
						radius="xs"
						onClick={onRunQuery}
						color={isQueryValid ? "surreal" : "pink.9"}
						variant={isQueryValid ? "gradient" : "filled"}
						style={{ border: "none" }}
						className={classes.run}
						rightSection={
							<Icon path={iconCursor} />
						}
					>
						Run {hasSelection ? 'selection' : 'query'}
					</Button>
				</Group>
			}
		>
			{(resultMode == "live") ? (
				<LivePreview
					query={activeTab}
					isLive={isLive}
				/>
			) : activeResponse ? (
				<>
					{resultMode == "combined" ? (
						<CombinedJsonPreview results={responses} />
					) : activeResponse.success ? (activeResponse.result?.length === 0 ? (
						<Text c="slate" flex={1}>
							No results found for query
						</Text>
					) : resultMode == "table" ? (
						<Box
							mih={0}
							flex={1}
							pos="relative"
						>
							<DataTable data={activeResponse.result} />
						</Box>
					) : (
						<SingleJsonPreview result={activeResponse.result} />
					)) : (
						<Text c="red" ff="mono" style={{ whiteSpace: "pre-wrap" }}>
							{activeResponse.result}
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
