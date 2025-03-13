import {
	Box,
	Center,
	Divider,
	Group,
	Paper,
	Progress,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { CloudMeasurement } from "~/types";
import { measureComputeHistory, measureComputeTotal } from "~/util/cloud";
import { iconQuery } from "~/util/icons";

export interface ComputeUsageBlockProps {
	usage: CloudMeasurement[] | undefined;
	isLoading: boolean;
}

export function ComputeUsageBlock({ usage, isLoading }: ComputeUsageBlockProps) {
	const computeHistory = measureComputeHistory(usage ?? []);
	const computeTotal = measureComputeTotal(usage ?? []);

	return (
		<Skeleton visible={isLoading}>
			<Paper
				gap={0}
				component={Stack}
				pos="relative"
				mih={202}
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

				{computeHistory.length === 0 ? (
					<Center flex={1}>
						<Text>Waiting for usage...</Text>
					</Center>
				) : (
					<Stack
						p="xl"
						gap="lg"
						flex={1}
					>
						{computeHistory.map(([type, hours], index) => (
							<Box key={index}>
								<Group>
									<Text
										c="bright"
										fz="xl"
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
									size={6}
									mt="md"
								/>
							</Box>
						))}

						<Divider />

						<Group my={-3}>
							<Text
								c="bright"
								fz="xl"
								fw={600}
							>
								Total hours
							</Text>
							<Spacer />
							<Text fz="lg">{computeTotal} hours</Text>
						</Group>
					</Stack>
				)}
			</Paper>
		</Skeleton>
	);
}
