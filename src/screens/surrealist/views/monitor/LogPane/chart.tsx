import classes from "./style.module.scss";

import { BarChart, ChartTooltip } from "@mantine/charts";
import { DurationUnit, differenceInHours, format } from "date-fns";
import { range } from "radash";
import { useMemo } from "react";
import { MONITOR_LOG_LEVEL_INFO } from "~/constants";
import { useStable } from "~/hooks/stable";
import { CloudLogLine } from "~/types";
import { startOfDate } from "~/util/helpers";

interface ChartMoment {
	time: number;
	info: number;
	warning: number;
	error: number;
}

const CHART_SERIES = [
	{ name: "info", color: "violet", label: "Infos" },
	{ name: "warning", color: "yellow", label: "Warnings" },
	{ name: "error", color: "red", label: "Errors" },
];

export interface LogActivityChartProps {
	toTime: Date;
	fromTime: Date;
	lines: CloudLogLine[];
}

export function LogActivityChart({ toTime, fromTime, lines }: LogActivityChartProps) {
	// Determine chart resolution and interval based on the time span
	const [resolution, interval] = useMemo<[DurationUnit, number]>(() => {
		const hourSpan = differenceInHours(toTime, fromTime);

		if (hourSpan < 3) {
			return ["minutes", 60_000];
		}

		if (hourSpan < 72) {
			return ["hours", 3_600_000];
		}

		return ["days", 86_400_000];
	}, [fromTime, toTime]);

	// Determine the chart start and end times
	const [startAt, endAt] = useMemo(() => {
		return [
			startOfDate(fromTime, resolution).getTime() + interval,
			startOfDate(toTime, resolution).getTime(),
		];
	}, [fromTime, toTime, interval, resolution]);

	// Compute chart data based on log lines and intervals
	const logData = useMemo(() => {
		const momentIndex: Map<number, ChartMoment> = new Map();
		const momentArray: ChartMoment[] = [];

		const generator = range<ChartMoment>(
			startAt,
			endAt,
			(time) => ({
				time,
				info: 0,
				warning: 0,
				error: 0,
			}),
			interval,
		);

		for (const moment of generator) {
			momentIndex.set(moment.time, moment);
			momentArray.push(moment);
		}

		for (const line of lines) {
			const lineTime = startOfDate(line.timestamp, resolution).getTime();
			const severity = MONITOR_LOG_LEVEL_INFO[line.level]?.[2];
			const minute = momentIndex.get(lineTime);

			if (!minute) {
				continue;
			}

			minute[severity]++;
		}

		return momentArray;
	}, [startAt, endAt, lines, resolution, interval]);

	// Time formatted tooltip
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
		<BarChart
			h={92}
			dataKey="time"
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
					strokeDasharray: "4 4",
				},
			]}
			xAxisProps={{
				scale: "time",
				type: "number",
				ticks: [startAt, endAt],
				domain: [`dataMin - ${interval / 2}`, `dataMax + ${interval / 2}`],
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
	);
}
