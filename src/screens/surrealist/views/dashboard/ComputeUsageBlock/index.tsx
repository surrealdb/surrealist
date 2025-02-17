import { Paper, Group, Divider, Text, Box, Loader, ScrollArea, Stack } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { CloudMeasurement } from "~/types";
import { measureComputeHistory, measureComputeTotal } from "~/util/cloud";
import { iconQuery } from "~/util/icons";

export interface ComputeUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	loading: boolean;
}

export function ComputeUsageBlock({ usage, loading }: ComputeUsageBlockProps) {
	const computeHistory = measureComputeHistory(usage ?? []);
	const computeTotal = measureComputeTotal(usage ?? []);

	return (
		<Paper
			p="xl"
			component={Stack}
			gap={0}
		>
			<Group>
				<Icon
					path={iconQuery}
					size="xl"
				/>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					Compute Usage
				</Text>
			</Group>
			<Divider my="md" />
			<Group my="md">
				<Box flex={1}>
					<Text
						c="bright"
						fw={500}
						fz="lg"
					>
						Total compute hours
					</Text>
					<Text fz="sm">Since the current billing period</Text>
				</Box>
				{loading ? (
					<Loader
						size="sm"
						mr="xs"
					/>
				) : (
					<Text
						c="bright"
						fw={600}
						fz={20}
					>
						{computeTotal} hours
					</Text>
				)}
			</Group>
			<Box
				flex={1}
				pos="relative"
			>
				{computeHistory.map(([type, hours]) => (
					<Paper
						key={type}
						withBorder={false}
						bg="slate.7"
						py="xs"
						px="lg"
						mt="xs"
					>
						<Group>
							<Text
								c="bright"
								fz="lg"
								flex={1}
							>
								{type}
							</Text>
							<Text
								c="bright"
								fz="xl"
							>
								{hours} hours
							</Text>
						</Group>
					</Paper>
				))}
			</Box>
		</Paper>
	);
}
