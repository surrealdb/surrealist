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
				p="xl"
				gap={0}
				component={Stack}
				pos="relative"
			>
				<Stack gap="xl">
					<Group>
						<ThemeIcon
							color="slate"
							radius="xs"
							size="xl"
						>
							<Icon
								path={iconQuery}
								size="xl"
								c="slate"
							/>
						</ThemeIcon>
						<Box>
							<PrimaryTitle mt={-4}>Compute usage</PrimaryTitle>
							<Text>Compute hours this billing cycle</Text>
						</Box>
					</Group>

					<Divider />

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
