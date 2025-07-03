import { AreaChart } from "@mantine/charts";
import { Group, StyleProp, Text, Tooltip } from "@mantine/core";
import { Center, Paper, Skeleton, Stack } from "@mantine/core";
import { format } from "date-fns";
import { computeMetricRange } from "~/cloud/helpers";
import { Icon } from "~/components/Icon";
import { CloudMetrics, MetricsDuration } from "~/types";
import { iconHelp } from "~/util/icons";

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
	yAxisDomain?: [number, number];
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
		<Skeleton visible={isLoading}>
			<Paper
				p="xl"
				gap={24}
				component={Stack}
				variant="gradient"
				pos="relative"
				h={height ?? 280}
			>
				{values.length < 2 ? (
					<Center flex={1}>
						<Text c="slate">Recording data...</Text>
					</Center>
				) : (
					<>
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
						<AreaChart
							data={values}
							withDots={false}
							dataKey="time"
							flex={1}
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
					</>
				)}
			</Paper>
		</Skeleton>
	);
}
