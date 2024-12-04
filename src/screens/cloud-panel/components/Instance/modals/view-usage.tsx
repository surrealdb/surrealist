import { Box, Divider, Group, Paper, Text, ThemeIcon } from "@mantine/core";
import { Stack } from "@mantine/core";
import { openModal } from "@mantine/modals";
import { useMemo } from "react";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useCloudUsageQuery } from "~/screens/cloud-panel/hooks/usage";
import type { CloudInstance } from "~/types";
import { iconQuery } from "~/util/icons";

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
	const { data } = useCloudUsageQuery(instance);

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
			<Paper
				bg="slate.9"
				p="xl"
				style={{ userSelect: "text", WebkitUserSelect: "text" }}
			>
				<Group>
					<ThemeIcon
						size="xl"
						color="surreal"
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
					<Text
						c="bright"
						fw={700}
						fz={22}
					>
						{totalCompute}h
					</Text>
				</Group>

				<Divider
					my="xl"
					color="slate.6"
				/>

				<Label>Instance types</Label>

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
			</Paper>

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
						fz={22}
					>
						0 MB
					</Text>
				</Group>
			</Paper> */}
		</Stack>
	);
}
