import type { SelectionRange } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";
import { Button, Center, Group, Stack, Text, Tooltip, UnstyledButton } from "@mantine/core";
import { unparse } from "papaparse";
import { isArray, isObject } from "radash";
import { useLayoutEffect, useMemo, useState } from "react";
import { isMini } from "~/adapter";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ListMenu } from "~/components/ListMenu";
import { ContentPane } from "~/components/Pane";
import { RESULT_FORMATS, RESULT_MODES } from "~/constants";
import { executeEditorQuery } from "~/editor/query";
import { useSetting } from "~/hooks/config";
import { useConnectionAndView } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { cancelLiveQueries } from "~/screens/surrealist/connection/connection";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useInterfaceStore } from "~/stores/interface";
import { useQueryStore } from "~/stores/query";
import type { Listable, QueryResponse, QueryTab, ResultFormat, ResultMode } from "~/types";
import {
	iconBroadcastOff,
	iconCursor,
	iconHelp,
	iconList,
	iconLive,
	iconQuery,
	iconUpload,
} from "~/util/icons";
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
	const responseMap = useDatabaseStore((s) => s.queryResponses);
	const isQueryValid = useQueryStore((s) => s.isQueryValid);

	const isLight = useIsLight();
	const [allowSelectionExecution] = useSetting("behavior", "querySelectionExecution");
	const [resultTab, setResultTab] = useState<number>(1);
	const selectedTab = resultTab - 1;
	const resultMode = activeTab.resultMode;
	const resultFormat = activeTab.resultFormat;
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
				description: `${rowCount} ${rowCount === 1 ? "result" : "results"} in ${res.execution_time}`,
				value: (i + 1).toString(),
			};
		});
	}, [responses]);

	const cancelQueries = useStable(() => {
		cancelLiveQueries(activeTab.id);
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset result tab when responses change
	useLayoutEffect(() => {
		setResultTab(1);
	}, [responseCount]);

	const activeMode = RESULT_MODES.find((r) => r.value === resultMode);
	const activeFormat = RESULT_FORMATS.find((r) => r.value === resultFormat);

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
	const isExportVisible = resultMode === "table";
	const canExport = useMemo(() => {
		return (
			isExportVisible &&
			isArray(selectedResponse.result) &&
			selectedResponse.result.length > 0 &&
			selectedResponse.result.every((r) => isObject(r))
		);
	}, [isExportVisible, selectedResponse.result]);

	const exportAsCsv = useStable(() => {
		const csvContent = unparse(selectedResponse.result);

		const blob = new Blob([csvContent], { type: "text/csv" });

		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "export.csv";

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	});

	const runText = `Run ${selection && allowSelectionExecution ? "selection" : "query"}`;

	return (
		<ContentPane
			title={panelTitle}
			icon={iconQuery}
			radius={corners}
			withDivider={resultMode !== "graph" || responseCount === 0}
			rightSection={
				<Group
					align="center"
					wrap="nowrap"
					className={classes.controls}
				>
					{isExportVisible ? (
						<Button
							onClick={exportAsCsv}
							variant="light"
							size="xs"
							radius="sm"
							color="slate"
							leftSection={<Icon path={iconUpload} />}
							disabled={!canExport}
						>
							Export as CSV
						</Button>
					) : null}

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
					) : resultMode === "combined" ? (
						<Text
							c={isLight ? "slate.5" : "slate.2"}
							className={classes.results}
						>
							{responseCount} {responseCount === 1 ? "response" : "responses"}
						</Text>
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
										radius="xs"
										aria-label="Change result"
										variant="light"
										color="slate"
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
						<Tooltip
							label="Change result mode"
							openDelay={300}
						>
							{isMini ? (
								<ActionButton
									label="Change result mode"
									h={30}
									w={30}
								>
									<Icon path={activeMode?.icon ?? iconHelp} />
								</ActionButton>
							) : (
								<Button
									size="xs"
									radius="xs"
									aria-label="Change result mode"
									variant="light"
									color="slate"
									leftSection={
										activeMode && <Icon path={activeMode?.icon ?? iconHelp} />
									}
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
						className={classes.runLarge}
						loading={isQuerying}
						onClick={runQuery}
						rightSection={<Icon path={iconCursor} />}
					>
						{runText}
					</Button>

					<ActionButton
						label={runText}
						radius="xs"
						size={30}
						color="slate"
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

			{responseCount === 0 ? (
				<Center
					h="100%"
					mih={80}
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
