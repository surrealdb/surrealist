import classes from "./style.module.scss";

import {
	Badge,
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
import { range } from "radash";
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
	WARN: [iconWarning, "yellow", "warning"],
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
				label={format(label, "dd MMM yyyy HH:mm")}
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
				pos="relative"
				style={{ overflow: "hidden" }}
			>
				<Box
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
							tickFormatter: (value) => format(value, "dd MMM yyyy HH:mm"),
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
				</Box>
				<Divider />
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
			</Paper>
		</Stack>
	);
}

interface LogLine extends BoxProps {
	line: CloudLogLine;
	index: number;
}

export function LogLine({ line, ...other }: LogLine) {
	const [icon, color, severity] = LOG_LEVEL_INFO[line.level] || [iconHelp, "blue", "info"];

	return (
		<Group
			miw={0}
			role="button"
			tabIndex={0}
			data-severity={severity}
			className={classes.line}
			{...other}
		>
			<Box
				w={96}
				pl="md"
			>
				<Badge
					pl="xs"
					radius="xs"
					size="md"
					variant="transparent"
					color={color}
					ff="monospace"
					leftSection={
						<Icon
							path={icon}
							c={color}
							size={0.9}
							mr="xs"
						/>
					}
				>
					{line.level}
				</Badge>
			</Box>

			<Tooltip label={formatDistanceToNow(line.timestamp, { addSuffix: true })}>
				<Text
					ff="monospace"
					className={classes.timestamp}
					w={132}
				>
					{formatDate(line.timestamp, "dd MMM HH:mm:ss")}
				</Text>
			</Tooltip>

			<Text
				flex={1}
				truncate
				ff="monospace"
				c="bright"
				className={classes.message}
			>
				{line.message}
			</Text>
		</Group>
	);
}
