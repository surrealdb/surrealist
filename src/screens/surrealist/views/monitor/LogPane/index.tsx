import classes from "./style.module.scss";

import {
	Badge,
	Box,
	BoxProps,
	Center,
	Group,
	Loader,
	MantineColor,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";

import { useDebouncedValue } from "@mantine/hooks";
import { formatDate, formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import { useCloudLogsQuery } from "~/cloud/queries/logs";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useConnection } from "~/hooks/connection";
import { CloudLogLine } from "~/types";
import { fuzzyMatch } from "~/util/helpers";
import { iconChevronRight, iconErrorCircle, iconHelp, iconList, iconWarning } from "~/util/icons";
import { MonitorContentProps } from "../helpers";
import { LogActions } from "./actions";

const LOG_LEVEL_DECORATION: Record<string, [string, MantineColor]> = {
	INFO: [iconHelp, "violet"],
	WARN: [iconWarning, "yellow"],
	ERROR: [iconErrorCircle, "red"],
	FATAL: [iconErrorCircle, "red"],
};

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
			<Box
				bg="transparent"
				flex={1}
				pos="relative"
				// p="xl"
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
		</Stack>
	);
}

interface LogLine extends BoxProps {
	line: CloudLogLine;
	index: number;
}

export function LogLine({ line, index, ...other }: LogLine) {
	const [icon, color] = LOG_LEVEL_DECORATION[line.level] || [iconHelp, "blue"];

	return (
		<Group
			px="md"
			role="button"
			tabIndex={0}
			data-odd={index % 2 === 1}
			className={classes.line}
			{...other}
		>
			<Tooltip label={formatDistanceToNow(line.timestamp, { addSuffix: true })}>
				<Text
					ff="monospace"
					className={classes.timestamp}
					w={124}
				>
					{formatDate(line.timestamp, "dd MMM HH:mm:ss")}
				</Text>
			</Tooltip>
			<Box w={96}>
				<Badge
					pl="xs"
					variant="light"
					color={color}
					ff="monospace"
					leftSection={
						<Icon
							path={icon}
							c={color}
							size="sm"
							left
						/>
					}
				>
					{line.level}
				</Badge>
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
		</Group>
	);
}
