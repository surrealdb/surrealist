import classes from "./style.module.scss";

import {
	ActionIcon,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Pagination,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";

import type { SelectionRange } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

import { iconBroadcastOff, iconCursor, iconHelp, iconLive, iconQuery } from "~/util/icons";

import type { SelectionRange } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { useState } from "react";
import { useLayoutEffect } from "react";
import { isMini } from "~/adapter";
import { DataTable } from "~/components/DataTable";
import { Icon } from "~/components/Icon";
import { ListMenu } from "~/components/ListMenu";
import { ContentPane } from "~/components/Pane";
import { RESULT_MODES } from "~/constants";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { cancelLiveQueries } from "~/screens/database/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import type { QueryResponse, ResultFormat, ResultMode, TabQuery } from "~/types";
import { CombinedJsonPreview, LivePreview, SingleJsonPreview } from "./preview";

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
	editor: EditorView | null;
	corners?: string;
}

export function ResultPane({
	activeTab,
	isQueryValid,
	selection,
	editor,
	corners,
}: ResultPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();

	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isQuerying = useDatabaseStore((s) => s.isQueryActive);
	const responseMap = useDatabaseStore((s) => s.queryResponses);

	const isLight = useIsLight();
	const [resultTab, setResultTab] = useState<number>(1);
	const resultMode = activeTab.resultMode;
	const resultFormat = activeTab.resultFormat;
	const responses = responseMap[activeTab.id] || [];
	const activeResponse = responses[resultTab - 1];

	const responseCount = responses.length;
	const rowCount = computeRowCount(activeResponse);

	const showCombined = resultMode === "combined" || resultMode === "live";
	const showTabs = !showCombined && responses.length > 1;
	const showResponses = showCombined && responseCount > 0;
	const showTime = !showCombined && !!activeResponse?.execution_time;

	const isLive = liveTabs.has(activeTab.id);

	const cancelQueries = useStable(() => {
		cancelLiveQueries(activeTab.id);
	});

	const runQuery = useStable(() => {
		if (editor) {
			executeEditorQuery(editor);
		}
	});

	const setResultMode = (mode: ResultMode) => {
		updateQueryTab({
			id: activeTab.id,
			resultMode: mode,
		});
	};

	const setResultFormat = (format: ResultFormat) => {
		updateQueryTab({
			id: activeTab.id,
			resultFormat: format,
		});
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset result tab when responses change
	useLayoutEffect(() => {
		setResultTab(1);
	}, [responses.length]);

	const activeMode = RESULT_MODES.find((r) => r.value === resultMode);
	const activeFormat = RESULT_FORMATS.find((r) => r.value === resultFormat);
	const hasSelection = selection?.empty === false;

	const statusText = showResponses
		? `${responseCount} ${responseCount === 1 ? "response" : "responses"}`
		: `${rowCount} ${rowCount === 1 ? "result" : "results"} ${showTime ? ` in ${activeResponse.execution_time}` : ""}`;

	const panelTitle =
		resultMode === "combined"
			? "Results"
			: resultMode === "live"
				? "Live Messages"
				: showTabs
					? `Result #${resultTab}`
					: "Result";

	return (
		<ContentPane
			title={panelTitle}
			icon={iconQuery}
			radius={corners}
			rightSection={
				<Group
					align="center"
					wrap="nowrap"
					className={classes.controls}
				>
					{resultMode === "live" ? (
						isLive && (
							<Button
								onClick={cancelQueries}
								color="pink"
								variant="light"
								size="xs"
								radius="sm"
								leftSection={<Icon path={iconBroadcastOff} />}
							>
								Stop listening
							</Button>
						)
					) : (
						<Text
							c={isLight ? "slate.5" : "slate.2"}
							className={classes.results}
						>
							{statusText}
						</Text>
					)}

					{!isMini && (
						<ListMenu
							data={RESULT_FORMATS}
							value={resultFormat}
							onChange={setResultFormat}
						>
							<Tooltip label="Change result format">
								<Button
									size="xs"
									radius="xs"
									aria-label="Change format mode"
									variant="light"
									color="slate"
									leftSection={
										activeFormat?.icon && <Icon path={activeFormat.icon} />
									}
								>
									{activeFormat?.label ?? resultFormat}
								</Button>
							</Tooltip>
						</ListMenu>
					)}

					<ListMenu
						data={RESULT_MODES}
						value={resultMode}
						onChange={setResultMode}
					>
						<Tooltip label="Change result mode">
							{isMini ? (
								<Tooltip label="Click to change mode">
									<ActionIcon
										aria-label={`Change result mode. Currently ${activeMode}`}
										h={30}
										w={30}
									>
										<Icon path={activeMode ? activeMode.icon : iconHelp} />
									</ActionIcon>
								</Tooltip>
							) : (
								<Button
									size="xs"
									radius="xs"
									aria-label="Change result mode"
									variant="light"
									color="slate"
									leftSection={activeMode && <Icon path={activeMode.icon} />}
								>
									{activeMode?.label ?? "Unknown"}
								</Button>
							)}
						</Tooltip>
					</ListMenu>

					<Button
						size="xs"
						radius="xs"
						color="slate"
						variant={isQueryValid ? "gradient" : "light"}
						style={{ border: "none" }}
						className={classes.run}
						loading={isQuerying}
						onClick={runQuery}
						rightSection={<Icon path={iconCursor} />}
					>
						Run {hasSelection ? "selection" : "query"}
					</Button>
				</Group>
			}
		>
			{isLive && resultMode !== "live" && (
				<UnstyledButton
					bg={isLight ? "slate.0" : "slate.9"}
					mb="md"
					p="md"
					onClick={() => setResultMode("live")}
					style={{
						borderRadius: "var(--mantine-radius-lg",
					}}
				>
					<Group>
						<Icon
							path={iconLive}
							c="slate"
							size="xl"
						/>
						<Text
							fw={500}
							c="bright"
						>
							Click here to open Live Mode and view incoming live messages
						</Text>
					</Group>
				</UnstyledButton>
			)}
			{resultMode === "live" ? (
				<LivePreview
					query={activeTab}
					isLive={isLive}
				/>
			) : activeResponse ? (
				<>
					{resultMode === "combined" ? (
						<CombinedJsonPreview results={responses} />
					) : activeResponse.success ? (
						activeResponse.result?.length === 0 ? (
							<Text
								c="slate"
								flex={1}
							>
								No results found for query
							</Text>
						) : resultMode === "table" ? (
							<Box
								mih={0}
								flex={1}
								pos="relative"
							>
								<DataTable data={activeResponse.result} />
							</Box>
						) : (
							<SingleJsonPreview result={activeResponse.result} />
						)
					) : (
						<Text
							c="red"
							ff="mono"
							style={{ whiteSpace: "pre-wrap" }}
						>
							{activeResponse.result}
						</Text>
					)}
				</>
			) : (
				<Center
					h="100%"
					c="slate"
				>
					<Stack>
						<Icon
							path={iconQuery}
							mx="auto"
							size="lg"
						/>
						Execute a SurrealQL query to view the results here
					</Stack>
				</Center>
			)}

			{showTabs && (
				<Stack
					gap="xs"
					align="center"
				>
					<Divider w="100%" />
					<Pagination
						total={responses.length}
						value={resultTab}
						onChange={setResultTab}
					/>
				</Stack>
			)}
		</ContentPane>
	);
}
