import {
	Box,
	Divider,
	Group,
	Loader,
	Paper,
	Progress,
	Skeleton,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { Stack } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsLight } from "~/hooks/theme";
import { useCloudUsageQuery } from "~/screens/surrealist/cloud-panel/hooks/usage";
import type { CloudInstance } from "~/types";
import { iconDatabase, iconQuery } from "~/util/icons";

export async function openUsageModal(instance: CloudInstance) {
	openModal({
		title: (
			<Box>
				<PrimaryTitle>Instance usage</PrimaryTitle>
				<Text fz="lg">{instance.name}</Text>
			</Box>
		),
		withCloseButton: true,
		children: <InstanceUsageModal instance={instance} />,
	});
}

interface InstanceUsageModalProps {
	instance: CloudInstance;
}

function InstanceUsageModal({ instance }: InstanceUsageModalProps) {
	const isLight = useIsLight();
	const { data, isPending } = useCloudUsageQuery(instance);

	const totalCompute = useMemo(() => {
		if (!data) return 0;

		return data.reduce((acc, { compute_hours }) => acc + (compute_hours ?? 0), 0);
	}, [data]);

	const computeHistory = useMemo(() => {
		if (!data) return [];

		return data.filter(
			({ compute_hours, instance_type }) =>
				compute_hours !== undefined && instance_type !== undefined,
		);
	}, [data]);

	return (
		<Stack>
			{/* <Paper
				bg="slate.9"
				p="xl"
				style={{ userSelect: "text", WebkitUserSelect: "text" }}
			>
				<Group>
					<ThemeIcon
						size="xl"
						color="blue"
						variant="light"
					>
						<Icon
							path={iconDatabase}
							size="lg"
						/>
					</ThemeIcon>
					<Box flex={1}>
						<Text
							c="bright"
							fw={500}
							fz="lg"
						>
							Storage usage
						</Text>
						<Text fz="sm">Current disk utilization</Text>
					</Box>
					<Text
						c="bright"
						fw={700}
						fz={20}
					>
						0 MB
					</Text>
				</Group>

				<Progress
					mt="xl"
					value={30}
					color="blue"
					size="sm"
				/>

				<Text mt="sm">You have used 30% of your 4 GB storage limit</Text>
			</Paper> */}

			<Paper
				p="xl"
				bg={isLight ? "slate.0" : "slate.9"}
				style={{ userSelect: "text", WebkitUserSelect: "text" }}
			>
				<Group>
					<ThemeIcon
						size="xl"
						color={isLight ? "surreal.6" : "surreal"}
						variant="light"
					>
						<Icon
							path={iconQuery}
							size="lg"
						/>
					</ThemeIcon>
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
					{isPending ? (
						<Loader
							size="sm"
							mr="xs"
						/>
					) : (
						<Text
							c="bright"
							fw={700}
							fz={20}
						>
							{totalCompute}h
						</Text>
					)}
				</Group>

				{computeHistory.length > 1 && (
					<>
						<Divider
							my="xl"
							color="slate.6"
						/>

						<Label>Instance type breakdown</Label>

						{computeHistory.map(({ compute_hours, instance_type }) => (
							<Group key={instance_type}>
								<Text
									c="bright"
									fw={500}
									fz="lg"
									flex={1}
								>
									{instance_type}
								</Text>
								<Text
									c="bright"
									fw={600}
									fz="xl"
								>
									{compute_hours}h
								</Text>
							</Group>
						))}
					</>
				)}
			</Paper>
		</Stack>
	);
}
