import { AreaChart } from "@mantine/charts";
import { Center, Group, Paper, Skeleton, Stack, Text, Tooltip } from "@mantine/core";
import dayjs from "dayjs";
import { Icon } from "~/components/Icon";
import { CloudMetrics } from "~/types";
import { iconHelp } from "~/util/icons";

export interface NetworkEgressChartProps {
	metrics: CloudMetrics | undefined;
	isLoading: boolean;
}

export function NetworkEgressChart({ metrics, isLoading }: NetworkEgressChartProps) {
	const timestamps = metrics?.values.timestamps ?? [];
	const data = metrics?.values.metrics ?? [];

	const series = data.map((metric) => ({
		name: metric.labels,
		color: "surreal",
		label: `Egress traffic (${metric.labels})`,
	}));

	const values = timestamps?.map((timestamp, i) => {
		const value: Record<string, unknown> = {
			label: dayjs(timestamp).format("HH:mm"),
		};

		for (const metric of data) {
			const data = metric.values[i];

			if (data !== null) {
				value[metric.labels] = Math.round(data / 1000);
			}
		}

		return value;
	});

	return (
		<Skeleton visible={isLoading}>
			<Paper
				p="xl"
				gap={24}
				component={Stack}
				pos="relative"
				h={280}
			>
				{values.length < 2 ? (
					<Center flex={1}>
						<Text c="slate">Recording egress network traffic...</Text>
					</Center>
				) : (
					<>
						<Group gap="xs">
							<Text
								c="bright"
								fw={700}
								fz="xl"
							>
								Network Egress
							</Text>

							<Tooltip label="The average outgoing network traffic measured in bytes per second">
								<div>
									<Icon
										path={iconHelp}
										size="sm"
									/>
								</div>
							</Tooltip>
						</Group>
						<AreaChart
							withDots={false}
							unit=" kb/s"
							yAxisProps={{
								unit: " kb/s",
								interval: 0,
							}}
							xAxisProps={{
								interval: Math.floor(timestamps.length / 5),
							}}
							dataKey="label"
							flex={1}
							series={series}
							data={values}
						/>
					</>
				)}
			</Paper>
		</Skeleton>
	);
}
