import { AreaChart } from "@mantine/charts";
import { Box, Group, Paper, Stack, StyleProp, Text, Tooltip } from "@mantine/core";
import { Icon, iconHelp } from "@surrealdb/ui";
import { format } from "date-fns";
import { computeMetricRange } from "~/cloud/helpers";
import { CloudMetrics, MetricsDuration } from "~/types";

export interface BaseAreaChartProps {
	title: string;
	isLoading: boolean;
	duration: MetricsDuration;
	values: Record<string, unknown>[];
	series: {
		name: string;
		color: string;
		label: string;
	}[];
	tooltip: any;
	height?: StyleProp<React.CSSProperties["height"]>;
	information?: string;
	yAxisUnit?: string;
	yAxisTicks?: number;
	yAxisDomain?: any;
	yAxisTickFormatter?: (value: any) => string;
}

export interface CommonAreaChartProps {
	instance: string | undefined;
	duration: MetricsDuration;
	height?: StyleProp<React.CSSProperties["height"]>;
	nodeFilter?: string[];
	onCalculateMetricsNodes?: (metrics: CloudMetrics) => void;
}

export function BaseAreaChart({
	title,
	isLoading,
	duration,
	values,
	series,
	tooltip,
	height,
	information,
	yAxisTicks,
	yAxisDomain,
	yAxisUnit,
	yAxisTickFormatter,
}: BaseAreaChartProps) {
	const [startAt, endAt] = computeMetricRange(duration);

	return (
		<Paper
			p="xl"
			gap={24}
			component={Stack}
			pos="relative"
			h={height ?? 280}
			withBorder
		>
			<Group gap="xs">
				<Text
					c="bright"
					fw={700}
					fz="xl"
				>
					{title}
				</Text>

				{information && (
					<Tooltip label={information}>
						<div>
							<Icon
								path={iconHelp}
								size="sm"
							/>
						</div>
					</Tooltip>
				)}
			</Group>
			<Box
				flex={1}
				opacity={isLoading ? 0 : 1}
				style={{ transition: "opacity 0.1s ease-in-out" }}
			>
				{isLoading ? (
					<Box />
				) : values.length < 2 ? (
					<Stack
						h="100%"
						justify="center"
						align="center"
						gap={0}
					>
						<Text>No data available</Text>
						<Text c="slate">Please check back later</Text>
					</Stack>
				) : (
					<AreaChart
						data={values}
						withDots={false}
						dataKey="time"
						h="100%"
						series={series}
						tooltipProps={{
							content: tooltip,
						}}
						yAxisProps={{
							interval: 0,
							unit: yAxisUnit,
							domain: yAxisDomain,
							tickCount: yAxisTicks,
							tickFormatter: yAxisTickFormatter,
						}}
						xAxisProps={{
							scale: "time",
							type: "number",
							interval: "equidistantPreserveStart",
							minTickGap: 15,
							domain: [startAt.valueOf(), endAt.valueOf()],
							tickFormatter(value) {
								return ["week", "month"].includes(duration)
									? format(value as number, "M/d/yy")
									: format(value as number, "hh:mm");
							},
						}}
					/>
				)}
			</Box>
		</Paper>
	);
}
