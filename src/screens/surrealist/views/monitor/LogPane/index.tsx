import classes from "./style.module.scss";

import {
	Badge,
	Box,
	Center,
	Divider,
	Group,
	Loader,
	MantineColor,
	Paper,
	ScrollArea,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";

import { formatDate, formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { useCloudLogsQuery } from "~/cloud/queries/logs";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { ContentPane } from "~/components/Pane";
import { useConnection } from "~/hooks/connection";
import { CloudLogLine } from "~/types";
import { iconChevronRight, iconErrorCircle, iconHelp, iconList, iconWarning } from "~/util/icons";
import { MonitorContentProps } from "../helpers";
import { LogActions } from "./actions";
import { fuzzyMatch } from "~/util/helpers";
import { useDebouncedValue } from "@mantine/hooks";

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
			<Paper
				// bg="transparent"
				flex={1}
				pos="relative"
				p="xl"
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
						<ScrollArea
							pos="absolute"
							type="scroll"
							inset={0}
						>
							{logLines.map((line, index) => (
								<LogLine
									key={index}
									line={line}
								/>
							))}
						</ScrollArea>
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

interface LogLine {
	line: CloudLogLine;
}

export function LogLine({ line }: LogLine) {
	const [icon, color] = LOG_LEVEL_DECORATION[line.level] || [iconHelp, "blue"];

	return (
		<>
			<Group
				p="md"
				role="button"
				tabIndex={0}
				className={classes.line}
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
					c="slate.0"
					className={classes.message}
				>
					{line.message}
				</Text>
			</Group>
			<Divider />
		</>
	);
}
