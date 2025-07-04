import classes from "./style.module.scss";

import {
	Box,
	BoxProps,
	Center,
	Divider,
	Group,
	Loader,
	MantineColor,
	Paper,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";

import { BarChart, ChartTooltip } from "@mantine/charts";
import { useDebouncedValue } from "@mantine/hooks";
import { format, formatDate, formatDistanceToNow, startOfMinute } from "date-fns";
import { capitalize, range } from "radash";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import { useCloudLogsQuery } from "~/cloud/queries/logs";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { CloudLogLine } from "~/types";
import { fuzzyMatch } from "~/util/helpers";
import { iconChevronRight, iconErrorCircle, iconHelp, iconList, iconWarning } from "~/util/icons";
import { MonitorContentProps } from "../helpers";
import { LogActions } from "./actions";

type Severity = "info" | "warning" | "error";

interface ChartMinute {
	minute: number;
	info: number;
	warning: number;
	error: number;
}

const LOG_LEVEL_INFO: Record<string, [string, MantineColor, Severity]> = {
	INFO: [iconHelp, "violet", "info"],
	WARN: [iconWarning, "orange", "warning"],
	ERROR: [iconErrorCircle, "red", "error"],
	FATAL: [iconErrorCircle, "red", "error"],
};

const CHART_SERIES = [
	{ name: "info", color: "violet", label: "Infos" },
	{ name: "warning", color: "yellow", label: "Warnings" },
	{ name: "error", color: "red", label: "Errors" },
];

export function LogPane({
	info,
	logOptions,
	sidebarMinimized,
	onRevealSidebar,
	onChangeLogOptions,
}: MonitorContentProps) {
	const instance = useConnection((con) => con?.authentication.cloudInstance);
	const logQuery = useCloudLogsQuery(instance, logOptions.duration);

	const [lazyLevel] = useDebouncedValue(logOptions.level, 300);
	const [lazySearch] = useDebouncedValue(logOptions.search, 300);

	const logLines = useMemo(() => {
		if (!logQuery.data) return [];

		return logQuery.data.log_lines
			.filter((line) => {
				if (lazyLevel && line.level !== lazyLevel) {
					return false;
				}

				if (lazySearch && !fuzzyMatch(lazySearch, line.message)) {
					return false;
				}

				return true;
			})
			.slice(0, 500);
	}, [logQuery.data, lazyLevel, lazySearch]);

	const [startMin, endMin] = useMemo(() => {
		if (!logQuery.data) return [0, 0];

		return [
			startOfMinute(logQuery.data?.from_time).getTime(),
			startOfMinute(logQuery.data?.to_time).getTime(),
		];
	}, [logQuery.data]);

	const logData = useMemo(() => {
		const minuteIndex: Map<number, ChartMinute> = new Map();
		const minuteArray: ChartMinute[] = [];
		const generator = range<ChartMinute>(
			startMin,
			endMin - 60_000,
			(minute) => ({
				minute,
				info: 0,
				warning: 0,
				error: 0,
			}),
			60_000,
		);

		for (const minute of generator) {
			minuteIndex.set(minute.minute, minute);
			minuteArray.push(minute);
		}

		for (const line of logLines) {
			const lineTime = startOfMinute(line.timestamp).getTime();
			const severity = LOG_LEVEL_INFO[line.level]?.[2];
			const minute = minuteIndex.get(lineTime);

			if (!minute) {
				throw new Error(`No minute found for timestamp ${lineTime}`);
			}

			minute[severity]++;
		}

		return minuteArray;
	}, [startMin, endMin, logLines]);

	const tooltip = useStable(({ label, payload }) => {
		return (
			<ChartTooltip
				label={label ? format(label, "MMMM d, yyyy - h:mm a") : "unset"}
				payload={payload}
				series={CHART_SERIES}
			/>
		);
	});

	return (
		<Stack h="100%">
			<ContentPane
				h="unset"
				icon={iconList}
				title={info.name}
				withDivider={false}
				leftSection={
					sidebarMinimized && (
						<ActionButton
							label="Reveal monitors"
							mr="sm"
							color="slate"
							variant="light"
							onClick={onRevealSidebar}
							aria-label="Reveal observables"
						>
							<Icon path={iconChevronRight} />
						</ActionButton>
					)
				}
				rightSection={
					<LogActions
						options={logOptions}
						isLoading={logQuery.isFetching}
						onChange={onChangeLogOptions}
						onRefresh={() => {
							logQuery.refetch();
						}}
					/>
				}
			/>
			<Paper
				flex={1}
				bg="transparent"
				style={{ overflow: "hidden" }}
				component={Stack}
				gap={0}
			>
				<Paper
					withBorder={false}
					px={32}
					pt="xl"
					pb="xs"
				>
					<BarChart
						h={92}
						dataKey="minute"
						type="stacked"
						data={logData}
						withYAxis={false}
						className={classes.chart}
						gridAxis="none"
						tooltipProps={{
							content: tooltip,
						}}
						referenceLines={[
							{
								y: 0,
								color: "slate",
								strokeDasharray: "5 5",
							},
						]}
						xAxisProps={{
							scale: "time",
							type: "number",
							domain: [startMin, endMin - 60_000],
							ticks: [startMin, endMin - 60_000],
							tickFormatter: (value) => format(value, "MMMM d, yyyy - h:mm a"),
							tick: {
								style: {
									fontFamily: "var(--mantine-font-family-monospace)",
									fill: "var(--mantine-color-text)",
									fontSize: "var(--mantine-font-size-xs)",
								},
							},
						}}
						series={CHART_SERIES}
					/>
				</Paper>
				<Divider />
				<Box
					pos="relative"
					flex={1}
					bg="slate.9"
				>
					{logQuery.isSuccess ? (
						logLines.length === 0 ? (
							<Center
								pos="absolute"
								inset={0}
							>
								No log entries found for the selected criteria.
							</Center>
						) : (
							<AutoSizer>
								{({ width, height }) => (
									<FixedSizeList
										height={height}
										itemCount={logLines.length}
										overscanCount={2}
										itemSize={46}
										width={width}
									>
										{({ index, style }) => (
											<LogLine
												line={logLines[index]}
												count={logLines.length}
												index={index}
												style={style}
											/>
										)}
									</FixedSizeList>
								)}
							</AutoSizer>
						)
					) : (
						<Center
							pos="absolute"
							inset={0}
						>
							<Loader />
						</Center>
					)}
				</Box>
			</Paper>
		</Stack>
	);
}

interface LogLine extends BoxProps {
	line: CloudLogLine;
	count: number;
	index: number;
}

export function LogLine({ line, count, index, ...other }: LogLine) {
	const [icon, color, severity] = LOG_LEVEL_INFO[line.level] || [iconHelp, "blue", "info"];

	const relativeTime = capitalize(formatDistanceToNow(line.timestamp, { addSuffix: true }));
	const absoluteTime = formatDate(line.timestamp, "MMMM d, yyyy - h:mm a");

	return (
		<Paper
			withBorder={false}
			data-odd={index % 2 === 1}
			data-severity={severity}
			data-last={count - 1 === index}
			className={classes.line}
			component={Group}
			radius={0}
			miw={0}
			{...other}
		>
			<Box w={52}>
				<Tooltip
					label={line.level}
					color={color}
					styles={{
						tooltip: {
							fontFamily: "var(--mantine-font-family-monospace)",
							fontWeight: 800,
						},
					}}
				>
					<Box
						px="xl"
						w="max-content"
					>
						<Icon
							path={icon}
							c={color}
						/>
					</Box>
				</Tooltip>
			</Box>

			<Box w={185}>
				<Tooltip label={relativeTime}>
					<Text
						ff="monospace"
						className={classes.timestamp}
						w="max-content"
					>
						{absoluteTime}
					</Text>
				</Tooltip>
			</Box>

			<Text
				flex={1}
				truncate
				ff="monospace"
				c="bright"
				className={classes.message}
			>
				{line.message}
			</Text>
		</Paper>
	);
}
