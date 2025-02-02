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
import { formatMemory } from "~/util/helpers";
import { iconDatabase, iconQuery } from "~/util/icons";
import { computeStorageSize } from "../../../util/helpers";
import {
	measureComputeHistory,
	measureComputeTotal,
	measureStorageUsage,
} from "../../../util/measurements";

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

	const computeHistory = measureComputeHistory(data ?? []);
	const computeTotal = measureComputeTotal(data ?? []);
	const storageUsage = measureStorageUsage(data ?? []);

	const storageMax = useMemo(() => {
		return computeStorageSize(instance.type);
	}, [instance.type]);

	const storageFrac = (storageUsage / storageMax) * 100;
	const storageUsageMB = formatMemory(storageUsage);
	const storageMaxMB = formatMemory(storageMax);
	const storageColor = storageFrac > 90 ? "red" : "blue";

	return (
		<Stack>
			<Paper
				p="xl"
				bg={isLight ? "slate.0" : "slate.9"}
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
						{storageUsageMB}
					</Text>
				</Group>

				<Progress
					mt="xl"
					value={storageFrac}
					color={storageColor}
					size="sm"
				/>

				<Text mt="sm">
					You have used {storageFrac.toFixed(2)}% of your {storageMaxMB} storage limit
				</Text>
			</Paper>

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
							{computeTotal}h
						</Text>
					)}
				</Group>

				{computeHistory.length > 1 && (
					<>
						<Divider my="xl" />

						<Label>Instance type breakdown</Label>

						{computeHistory.map(([type, hours]) => (
							<Group key={type}>
								<Text
									c="bright"
									fw={500}
									fz="lg"
									flex={1}
								>
									{type}
								</Text>
								<Text
									c="bright"
									fw={600}
									fz="xl"
								>
									{hours}h
								</Text>
							</Group>
						))}
					</>
				)}
			</Paper>
		</Stack>
	);
}
