import { Box, Center, Group, Paper, Progress, Skeleton, Stack, Text } from "@mantine/core";
import { Spacer } from "~/components/Spacer";
import { CloudMeasurement } from "~/types";
import { measureComputeHistory, measureComputeTotal } from "~/util/cloud";

export interface ComputeHoursBlockProps {
	usage: CloudMeasurement[] | undefined;
	isLoading: boolean;
}

export function ComputeHoursBlock({ usage, isLoading }: ComputeHoursBlockProps) {
	const computeHistory = measureComputeHistory(usage ?? []);
	const computeTotal = measureComputeTotal(usage ?? []);

	return (
		<Skeleton visible={isLoading}>
			<Paper
				p="xl"
				gap={30}
				component={Stack}
				variant="gradient"
				pos="relative"
				mih={168}
			>
				{computeHistory.length === 0 ? (
					<Center flex={1}>
						<Text c="slate">Recording compute hours...</Text>
					</Center>
				) : (
					<>
						<Stack gap={0}>
							<Text
								c="bright"
								fw={700}
								fz="xl"
							>
								Compute hours
							</Text>
							<Text>{computeTotal} hours total</Text>
						</Stack>

						{computeHistory.map(([type, hours], index) => (
							<Box key={index}>
								<Group>
									<Text
										c="bright"
										fz="lg"
										fw={600}
									>
										{type}
									</Text>
									<Spacer />
									<Text fz="lg">{hours} hours</Text>
								</Group>

								<Progress
									value={(hours / computeTotal) * 100}
									color="surreal"
									size={4}
									mt="md"
								/>
							</Box>
						))}
					</>
				)}
			</Paper>
		</Skeleton>
	);
}
