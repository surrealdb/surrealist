import type { SelectionRange } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Button, Center, Group, Menu, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import {
	Icon,
	iconBroadcastOff,
	iconCopy,
	iconCursor,
	iconDotsVertical,
	iconDownload,
	iconHelp,
	iconList,
	iconLive,
	iconQuery,
	iconTrash,
} from "@surrealdb/ui";
import dayjs from "dayjs";
import { unparse } from "papaparse";
import { isArray, isObject } from "radash";
import { useLayoutEffect, useMemo, useState } from "react";
import { adapter, isMini } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { ListMenu } from "~/components/ListMenu";
import { ContentPane } from "~/components/Pane";
import {
	CSV_FILTER,
	JSON_FILTER,
	NONE_RESULT_MODES,
	RESULT_FORMATS,
	RESULT_MODES,
} from "~/constants";
import { executeEditorQuery } from "~/editor/query";
import { useSetting } from "~/hooks/config";
import { useConnectionAndView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useElapsedTime } from "~/hooks/timer";
import { cancelLiveQueries } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type {
	Listable,
	NoneResultMode,
	QueryResponse,
	QueryTab,
	ResultFormat,
	ResultMode,
} from "~/types";
import { tagEvent } from "~/util/analytics";
import { showInfo, slugify } from "~/util/helpers";
import type { PreviewProps } from "./previews";
import { CombinedPreview } from "./previews/combined";
import { GraphPreview } from "./previews/graph";
import { IndividualPreview } from "./previews/individual";
import { LivePreview } from "./previews/live";
import { TablePreview } from "./previews/table";
import classes from "./style.module.scss";

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

const PREVIEW_MODES: Record<ResultMode, React.FC<PreviewProps>> = {
	combined: CombinedPreview,
	single: IndividualPreview,
	table: TablePreview,
	graph: GraphPreview,
	live: LivePreview,
};

export interface ResultPaneProps {
	activeTab: QueryTab;
	selection: SelectionRange | undefined;
	editor: EditorView;
	corners?: string;
}

export function ResultPane({ activeTab, selection, editor, corners }: ResultPaneProps) {
	const { updateQueryTab } = useConfigStore.getState();
	const [connection] = useConnectionAndView();

	const liveTabs = useInterfaceStore((s) => s.liveTabs);
	const isQuerying = useDatabaseStore((s) => s.isQueryActive);
	const queryTiming = useDatabaseStore((s) => s.queryTimings[activeTab.id]);
	const responseMap = useDatabaseStore((s) => s.queryResponses);
	const isQueryValid = useQueryStore((s) => s.isQueryValid);
	const elapsedTime = useElapsedTime(
		queryTiming?.startedAt ?? null,
		queryTiming?.endedAt ?? null,
	);

	const [allowSelectionExecution] = useSetting("behavior", "querySelectionExecution");
	const [resultTab, setResultTab] = useState<number>(1);
	const selectedTab = resultTab - 1;
	const resultMode = activeTab.resultMode;
	const resultFormat = activeTab.resultFormat;
	const noneResultsMode = activeTab.noneResultMode;
	const responses = responseMap[activeTab.id] || [];
	const responseCount = responses.length;

	const showCombined = resultMode === "combined" || resultMode === "live";
	const showQueries = !showCombined && responses.length > 0;
	const isLive = liveTabs.has(activeTab.id);

	const queryList = useMemo(() => {
		return responses.map<Listable>((res, i) => {
			const rowCount = computeRowCount(res);

			return {
				label: `Query ${i + 1}`,
				description: `${rowCount} ${rowCount === 1 ? "result" : "results"} in ${res.duration?.toString() ?? "unknown time"}`,
				value: (i + 1).toString(),
			};
		});
	}, [responses]);

	const messages = useInterfaceStore((s) => s.liveQueryMessages[activeTab.id] || []);

	const cancelQueries = useStable(() => {
		cancelLiveQueries(activeTab.id);
	});

	const clearMessages = useStable(() => {
		useInterfaceStore.getState().clearLiveQueryMessages(activeTab.id);
	});

	const runQuery = useStable(() => {
		if (editor) {
			executeEditorQuery(editor, allowSelectionExecution);
		}
	});

	const setResultMode = (mode: ResultMode) => {
		if (!connection) return;

		updateQueryTab(connection, {
			id: activeTab.id,
			resultMode: mode,
		});
	};

	const setResultFormat = (format: ResultFormat) => {
		if (!connection) return;

		updateQueryTab(connection, {
			id: activeTab.id,
			resultFormat: format,
		});
	};

	const setNoneResultsMode = (mode: NoneResultMode) => {
		if (!connection) return;

		updateQueryTab(connection, {
			id: activeTab.id,
			noneResultMode: mode,
		});
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset result tab when responses change
	useLayoutEffect(() => {
		setResultTab(1);
	}, [responseCount]);

	const activeMode = RESULT_MODES.find((r) => r.value === resultMode);
	const activeFormat = RESULT_FORMATS.find((r) => r.value === resultFormat);
	const activeNoneMode = NONE_RESULT_MODES.find((r) => r.value === noneResultsMode);

	const panelTitle =
		resultMode === "combined"
			? "Results"
			: resultMode === "live"
				? "Live Messages"
				: showQueries
					? `Result #${resultTab}`
					: "Result";

	const Preview = PREVIEW_MODES[resultMode];

	const showFormat = !isMini && (resultMode === "combined" || resultMode === "single");

	const selectedResponse = responses[selectedTab] ?? { result: null };

	const exportResult = useMemo(() => {
		if (resultMode === "combined") {
			return responses.map((r) => r.result);
		}
		return selectedResponse.result;
	}, [resultMode, responses, selectedResponse.result]);

	const hasResults = responseCount > 0 && exportResult != null;
	const isExportable = hasResults && resultMode !== "live" && resultMode !== "graph";

	const canExportCsv = useMemo(() => {
		return (
			isArray(selectedResponse.result) &&
			selectedResponse.result.length > 0 &&
			selectedResponse.result.every((r) => isObject(r))
		);
	}, [selectedResponse.result]);

	const copyAsJson = useStable(() => {
		const json = JSON.stringify(exportResult, null, 2);

		navigator.clipboard.writeText(json);

		showInfo({
			title: "Copied",
			subtitle: "Results copied to clipboard as JSON",
		});
	});

	const exportAsJson = useStable(async () => {
		const json = JSON.stringify(exportResult, null, 2);
		const fileName = `${slugify(activeTab.name ?? "")}-${dayjs().format("YYYY-MM-DD")}.json`;

		const success = await adapter.saveFile(
			"Save JSON export",
			fileName,
			[JSON_FILTER],
			() => new Blob([json], { type: "application/json" }),
		);

		if (success) {
			showInfo({
				title: "Export",
				subtitle: "Results successfully exported",
			});

			tagEvent("export", { extension: "json" });
		}
	});

	const exportAsCsv = useStable(async () => {
		const csvContent = unparse(selectedResponse.result);
		const fileName = `${slugify(activeTab.name ?? "")}-${dayjs().format("YYYY-MM-DD")}.csv`;

		const success = await adapter.saveFile(
			"Save CSV export",
			fileName,
			[CSV_FILTER],
			() => new Blob([csvContent], { type: "text/csv" }),
		);

		if (success) {
			showInfo({
				title: "Export",
				subtitle: "Results successfully exported",
			});

			tagEvent("export", { extension: "csv" });
		}
	});

	const runText = `Run ${selection && allowSelectionExecution ? "selection" : "query"}`;

	return (
		<ContentPane
			title={panelTitle}
			icon={iconQuery}
			radius={corners}
			withDivider={resultMode !== "graph" || responseCount === 0}
			infoSection={
				elapsedTime && (
					<Group
						gap={2}
						wrap="nowrap"
					>
						<Text
							size="xs"
							c="obsidian.3"
							fw={500}
							ff="mono"
						>
							{elapsedTime}
						</Text>
						{!isQuerying && (
							<Tooltip
								multiline
								maw={250}
								openDelay={300}
								ta="center"
								label="This is the total round-trip duration of the request, not the execution time of individual queries"
							>
								<div>
									<Icon
										path={iconHelp}
										size="sm"
										c="obsidian.4"
									/>
								</div>
							</Tooltip>
						)}
					</Group>
				)
			}
			rightSection={
				<Group
					align="center"
					wrap="nowrap"
					className={classes.controls}
				>
					<Group
						wrap="nowrap"
						gap="xs"
						className={classes.optionsExpanded}
					>
						{isExportable && (
							<Menu
								position="bottom-end"
								transitionProps={{ transition: "scale-y" }}
							>
								<Menu.Target>
									<Button
										variant="light"
										size="xs"
										color="obsidian"
										leftSection={<Icon path={iconDownload} />}
									>
										Export Results
									</Button>
								</Menu.Target>
								<Menu.Dropdown>
									<Menu.Item
										leftSection={<Icon path={iconCopy} />}
										onClick={copyAsJson}
									>
										Copy as JSON
									</Menu.Item>
									<Menu.Item
										leftSection={<Icon path={iconDownload} />}
										onClick={exportAsJson}
									>
										Save as JSON
									</Menu.Item>
									{canExportCsv && (
										<Menu.Item
											leftSection={<Icon path={iconDownload} />}
											onClick={exportAsCsv}
										>
											Save as CSV
										</Menu.Item>
									)}
								</Menu.Dropdown>
							</Menu>
						)}

						{resultMode === "live" ? (
							<>
								{messages.length > 0 && (
									<Button
										onClick={clearMessages}
										color="obsidian"
										variant="light"
										size="xs"
										leftSection={<Icon path={iconTrash} />}
									>
										Clear messages
									</Button>
								)}
								{isLive && (
									<Button
										onClick={cancelQueries}
										color="pink"
										variant="light"
										size="xs"
										leftSection={<Icon path={iconBroadcastOff} />}
									>
										Stop listening
									</Button>
								)}
							</>
						) : resultMode === "combined" ? (
							<ListMenu
								data={NONE_RESULT_MODES}
								value={noneResultsMode}
								onChange={setNoneResultsMode}
							>
								<Tooltip
									label="Change NONE display"
									openDelay={300}
								>
									<Button
										size="xs"
										aria-label="Change NONE display"
										variant="light"
										color="obsidian"
										leftSection={
											activeNoneMode?.icon && (
												<Icon path={activeNoneMode.icon} />
											)
										}
									>
										{responseCount}{" "}
										{responseCount === 1 ? "response" : "responses"}
									</Button>
								</Tooltip>
							</ListMenu>
						) : (
							showQueries && (
								<ListMenu
									data={queryList}
									value={resultTab.toString()}
									onChange={(e) => setResultTab(Number.parseInt(e ?? "1"))}
								>
									<Tooltip
										label="Change result"
										openDelay={300}
									>
										<Button
											size="xs"
											aria-label="Change result"
											variant="light"
											color="obsidian"
											leftSection={<Icon path={iconList} />}
										>
											Query {resultTab}
										</Button>
									</Tooltip>
								</ListMenu>
							)
						)}

						{showFormat && (
							<ListMenu
								data={RESULT_FORMATS}
								value={resultFormat}
								onChange={setResultFormat}
							>
								<Tooltip
									label="Change result format"
									openDelay={300}
								>
									<Button
										size="xs"
										aria-label="Change format mode"
										variant="light"
										color="obsidian"
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
							<Tooltip
								label="Change result mode"
								openDelay={300}
							>
								{isMini ? (
									<ActionButton
										label="Change result mode"
										variant="light"
										h={30}
										w={30}
									>
										<Icon path={activeMode?.icon ?? iconHelp} />
									</ActionButton>
								) : (
									<Button
										size="xs"
										aria-label="Change result mode"
										variant="light"
										color="obsidian"
										leftSection={
											activeMode && (
												<Icon path={activeMode?.icon ?? iconHelp} />
											)
										}
									>
										{activeMode?.label ?? "Unknown"}
									</Button>
								)}
							</Tooltip>
						</ListMenu>
					</Group>

					<Menu
						position="left"
						transitionProps={{ transition: "scale-y" }}
					>
						<Menu.Target>
							<ActionButton
								label="Options"
								variant="light"
								className={classes.optionsCollapsed}
							>
								<Icon path={iconDotsVertical} />
							</ActionButton>
						</Menu.Target>
						<Menu.Dropdown>
							{isExportable && (
								<>
									<Menu.Label>Export</Menu.Label>
									<Menu.Item
										leftSection={<Icon path={iconCopy} />}
										onClick={copyAsJson}
									>
										Copy as JSON
									</Menu.Item>
									<Menu.Item
										leftSection={<Icon path={iconDownload} />}
										onClick={exportAsJson}
									>
										Save as JSON
									</Menu.Item>
									{canExportCsv && (
										<Menu.Item
											leftSection={<Icon path={iconDownload} />}
											onClick={exportAsCsv}
										>
											Save as CSV
										</Menu.Item>
									)}
									<Menu.Divider />
								</>
							)}

							{resultMode === "live" ? (
								<>
									{messages.length > 0 && (
										<Menu.Item
											leftSection={<Icon path={iconTrash} />}
											onClick={clearMessages}
										>
											Clear messages
										</Menu.Item>
									)}
									{isLive && (
										<Menu.Item
											leftSection={<Icon path={iconBroadcastOff} />}
											onClick={cancelQueries}
											color="pink"
										>
											Stop listening
										</Menu.Item>
									)}
								</>
							) : resultMode === "combined" ? (
								<>
									<Menu.Label>NONE display</Menu.Label>
									{NONE_RESULT_MODES.map((mode) => (
										<Menu.Item
											key={mode.value}
											leftSection={mode.icon && <Icon path={mode.icon} />}
											onClick={() => setNoneResultsMode(mode.value)}
											variant={
												noneResultsMode === mode.value
													? "gradient"
													: undefined
											}
										>
											{mode.label}
										</Menu.Item>
									))}
								</>
							) : (
								showQueries && (
									<>
										<Menu.Label>Query result</Menu.Label>
										{queryList.map((q) => (
											<Menu.Item
												key={q.value}
												onClick={() =>
													setResultTab(Number.parseInt(q.value))
												}
												variant={
													resultTab.toString() === q.value
														? "gradient"
														: undefined
												}
											>
												{q.label}
											</Menu.Item>
										))}
									</>
								)
							)}

							{showFormat && (
								<>
									<Menu.Divider />
									<Menu.Label>Result format</Menu.Label>
									{RESULT_FORMATS.map((fmt) => (
										<Menu.Item
											key={fmt.value}
											leftSection={fmt.icon && <Icon path={fmt.icon} />}
											onClick={() => setResultFormat(fmt.value)}
											variant={
												resultFormat === fmt.value ? "gradient" : undefined
											}
										>
											{fmt.label}
										</Menu.Item>
									))}
								</>
							)}

							<Menu.Divider />
							<Menu.Label>Result mode</Menu.Label>
							{RESULT_MODES.map((mode) => (
								<Menu.Item
									key={mode.value}
									leftSection={mode.icon && <Icon path={mode.icon} />}
									onClick={() => setResultMode(mode.value)}
									variant={resultMode === mode.value ? "gradient" : undefined}
								>
									{mode.label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>

					<Button
						size="xs"
						color="obsidian"
						variant={isQueryValid ? "gradient" : "light"}
						style={{ border: "none" }}
						className={classes.runLarge}
						loading={isQuerying}
						onClick={runQuery}
						rightSection={<Icon path={iconCursor} />}
					>
						{runText}
					</Button>

					<ActionButton
						label={runText}
						color="obsidian"
						variant={isQueryValid ? "gradient" : "light"}
						className={classes.runSmall}
						loading={isQuerying}
						onClick={runQuery}
					>
						<Icon path={iconCursor} />
					</ActionButton>
				</Group>
			}
		>
			{isLive && resultMode !== "live" && (
				<UnstyledButton
					bg="var(--mantine-color-body)"
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
							c="obsidian"
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

			{responseCount === 0 ? (
				<Center
					h="100%"
					mih={80}
					c="obsidian"
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
			) : (
				<Preview
					responses={responses}
					selected={selectedTab}
					query={activeTab}
					isLive={isLive}
				/>
			)}
		</ContentPane>
	);
}
