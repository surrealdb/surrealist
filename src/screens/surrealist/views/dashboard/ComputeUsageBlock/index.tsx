import { Paper, Group, Divider, Text, Stack, Box, ThemeIcon, Progress } from "@mantine/core";
import { Icon } from "~/components/Icon";
import { CloudMeasurement } from "~/types";
import { measureComputeHistory, measureComputeTotal } from "~/util/cloud";
import { iconQuery } from "~/util/icons";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";

export interface ComputeUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	loading: boolean;
}

export function ComputeUsageBlock({ usage, loading }: ComputeUsageBlockProps) {
	const computeHistory = measureComputeHistory(usage ?? []);
	const computeTotal = measureComputeTotal(usage ?? []);

	return (
		<Box>
			<Paper
				gap={0}
				component={Stack}
				pos="relative"
			>
				<Group p="xl">
					<Icon
						path={iconQuery}
						size="lg"
					/>
					<Text
						c="bright"
						fw={700}
						fz="xl"
					>
						Compute usage
					</Text>
				</Group>

				<Divider />

				<Stack
					p="xl"
					gap="xl"
				>
					{computeHistory.map(([type, hours], index) => (
						<Box key={index}>
							<Group>
								<Text
									c="bright"
									fz="xl"
									fw={500}
								>
									{type}
								</Text>
								<Spacer />
								<Text fz="lg">{hours} hours</Text>
							</Group>

							<Progress
								value={(hours / computeTotal) * 100}
								color="surreal"
								size={6}
								mt="xs"
							/>
						</Box>
					))}

					{computeHistory.length > 1 && (
						<>
							<Divider />

							<Group>
								<Text
									c="bright"
									fz="xl"
									fw={500}
								>
									Total hours
								</Text>
								<Spacer />
								<Text fz="lg">{computeTotal} hours</Text>
							</Group>
						</>
					)}
				</Stack>
			</Paper>
		</Box>
	);
}
