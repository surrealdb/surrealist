import classes from "./style.module.scss";

import { Box, BoxProps, Center, Group, Loader, Paper, Stack, Text, Tooltip } from "@mantine/core";

import { useDebouncedValue } from "@mantine/hooks";
import { formatDate, formatDistanceToNow } from "date-fns";
import { capitalize } from "radash";
import { useEffect, useMemo, useRef } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import { computeMetricRange } from "~/cloud/helpers";
import { useCloudLogsQuery } from "~/cloud/queries/logs";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { MONITOR_LOG_LEVEL_INFO } from "~/constants";
import { useConnection } from "~/hooks/connection";
import { useIsLight } from "~/hooks/theme";
import { CloudLogLine } from "~/types";
import { fuzzyMatch } from "~/util/helpers";
import { iconChevronRight, iconHelp, iconList } from "~/util/icons";
import { MonitorContentProps } from "../helpers";
import { LogActions } from "./actions";
import { LogActivityChart } from "./chart";

export function LogPane({
	info,
	logOptions,
	sidebarMinimized,
	onRevealSidebar,
	onChangeLogOptions,
}: MonitorContentProps) {
	const isLight = useIsLight();
	const listRef = useRef<FixedSizeList>(null);
	const instance = useConnection((con) => con?.authentication.cloudInstance);
	const logQuery = useCloudLogsQuery(instance, logOptions.duration);

	const [lazyLevel] = useDebouncedValue(logOptions.level, 300);
	const [lazySearch] = useDebouncedValue(logOptions.search, 300);

	const [fromTime, toTime] = useMemo(() => {
		return computeMetricRange(logOptions.duration);
	}, [logOptions.duration]);

	// Filter log lines based on options
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
			.sort((a, b) => {
				return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
			})
			.slice(0, 1000); // TODO Make this expandable
	}, [logQuery.data, lazyLevel, lazySearch]);

	// Scroll to the bottom of the log list when new lines are added
	useEffect(() => {
		setTimeout(() => {
			listRef.current?.scrollToItem(logLines.length - 1, "end");
		});
	}, [logLines]);

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
			{logQuery.isSuccess && logLines.length > 0 && (
				<Paper
					pt="xl"
					px="xl"
				>
					<LogActivityChart
						fromTime={fromTime}
						toTime={toTime}
						lines={logLines}
					/>
				</Paper>
			)}
			<Paper
				flex={1}
				style={{ overflow: "hidden" }}
				component={Stack}
				gap={0}
				pos="relative"
				bg={isLight ? "slate.0" : "slate.9"}
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
									initialScrollOffset={logLines.length * 46}
									overscanCount={2}
									itemSize={46}
									width={width}
									ref={listRef}
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
	const [icon, color, severity] = MONITOR_LOG_LEVEL_INFO[line.level] || [
		iconHelp,
		"blue",
		"info",
	];

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
