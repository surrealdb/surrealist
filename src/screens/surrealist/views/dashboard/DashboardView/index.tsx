import classes from "./style.module.scss";

import {
	ActionIcon,
	Button,
	CopyButton,
	Group,
	Select,
	SimpleGrid,
	Skeleton,
	Text,
} from "@mantine/core";
import { Box, ScrollArea, Stack } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { memo, useState } from "react";
import { Redirect } from "wouter";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudMetricsQuery } from "~/cloud/queries/metrics";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { Icon } from "~/components/Icon";
import { InstanceActions } from "~/components/InstanceActions";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useBoolean } from "~/hooks/boolean";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { MetricsDuration } from "~/types";
import { iconCheck, iconChevronDown, iconClock, iconCopy } from "~/util/icons";
import { BackupsBlock } from "../BackupsBlock";
import { ComputeActivityChart } from "../ComputeActivityChart";
import { ComputeUsageBlock } from "../ComputeUsageBlock";
import { ConfigurationBlock } from "../ConfigurationBlock";
import { ConfiguratorDrawer } from "../ConfiguratorDrawer";
import { ConnectBlock } from "../ConnectBlock";
import { DiskUsageBlock } from "../DiskUsageBlock";
import { MemoryUsageChart } from "../MemoryUsageChart";
import { NavigationBlock } from "../NavigationBlock";
import { NetworkEgressChart } from "../NetworkEgressChart";
import { NetworkIngressChart } from "../NetworkIngressChart";
import { ResumeBlock } from "../ResumeBlock";
import { UpdateBlock } from "../UpdateBlock";

const UpdateBlockLazy = memo(UpdateBlock);
const ResumeBlockLazy = memo(ResumeBlock);
const ConfigurationBlockLazy = memo(ConfigurationBlock);
const ConnectBlockLazy = memo(ConnectBlock);
const ComputeUsageBlockLazy = memo(ComputeUsageBlock);
const DiskUsageBlockLazy = memo(DiskUsageBlock);
const BackupsBlockLazy = memo(BackupsBlock);
const ConfiguratorDrawerLazy = memo(ConfiguratorDrawer);

export function DashboardView() {
	const [isCloud, instance] = useConnection((c) => [
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
	]);

	const { mutateAsync } = useUpdateInstanceVersionMutation(instance);
	const handleUpdate = useUpdateConfirmation(mutateAsync);

	const [configuring, configureHandle] = useBoolean();
	const [activeTab, setActiveTab] = useState("capabilities");
	const [metricsDuration, setMetricsDuration] = useInputState<MetricsDuration>("hour");

	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instance);
	const { data: backups, isPending: backupsPending } = useCloudBackupsQuery(instance);
	const { data: usage, isPending: usagePending } = useCloudUsageQuery(instance);

	const { data: networkIngressMetrics, isPending: networkIngressMetricsPending } =
		useCloudMetricsQuery(instance, "ingress", metricsDuration);
	const { data: networkEgressMetrics, isPending: networkEgressMetricsPending } =
		useCloudMetricsQuery(instance, "egress", metricsDuration);
	const { data: memoryMetrics, isPending: memoryMetricsPending } = useCloudMetricsQuery(
		instance,
		"memory",
		metricsDuration,
	);
	const { data: cpuMetrics, isPending: cpuMetricsPending } = useCloudMetricsQuery(
		instance,
		"cpu",
		metricsDuration,
	);

	const handleUpgrade = useStable(() => {
		setActiveTab("type");
		configureHandle.open();
	});

	const handleVersions = useStable(() => {
		setActiveTab("version");
		configureHandle.open();
	});

	const isLoading = detailsPending || backupsPending || usagePending;

	if (!isCloud) {
		return <Redirect to="/query" />;
	}

	if (details?.state === "deleting") {
		return <Redirect to="/overview" />;
	}

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={250} />

			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBlock: 75 },
				}}
			>
				<Stack
					mx="auto"
					maw={1150}
					h="100%"
					gap="xl"
				>
					<Box mb={38}>
						{isLoading ? (
							<>
								<Skeleton
									w="100%"
									maw={250}
									height={41}
									my={10}
								/>
								<Skeleton
									w="100%"
									maw={500}
									height={18}
									my={2}
								/>
							</>
						) : (
							<>
								<Group>
									<PrimaryTitle fz={38}>{details?.name}</PrimaryTitle>
									{details?.state && (
										<StateBadge
											mt="xs"
											ml="xs"
											size={14}
											state={details.state}
										/>
									)}
									<Spacer />
									{details && (
										<InstanceActions instance={details}>
											<Button
												color="slate"
												variant="light"
												rightSection={<Icon path={iconChevronDown} />}
											>
												Actions
											</Button>
										</InstanceActions>
									)}
								</Group>
								<Group gap="sm">
									<Text fz="md">{details?.host}</Text>
									<CopyButton value={details?.host ?? ""}>
										{({ copied, copy }) => (
											<ActionIcon
												variant={copied ? "gradient" : undefined}
												size="sm"
												onClick={copy}
												aria-label="Copy hostname to clipboard"
											>
												<Icon
													path={copied ? iconCheck : iconCopy}
													size="sm"
												/>
											</ActionIcon>
										)}
									</CopyButton>
								</Group>
							</>
						)}
					</Box>

					<NavigationBlock isLoading={isLoading} />

					<Box mt={32}>
						<PrimaryTitle>Your instance</PrimaryTitle>
						<Text>Customise and connect to your Surreal Cloud instance</Text>
					</Box>

					{details && (
						<UpdateBlockLazy
							instance={details}
							isLoading={isLoading}
							onUpdate={handleUpdate}
							onVersions={handleVersions}
						/>
					)}

					<SimpleGrid
						cols={2}
						spacing="xl"
					>
						<ConfigurationBlockLazy
							instance={details}
							isLoading={isLoading}
							onConfigure={configureHandle.open}
						/>
						{details && !isLoading && details.state === "paused" ? (
							<ResumeBlockLazy instance={details} />
						) : (
							<ConnectBlockLazy
								instance={details}
								isLoading={isLoading}
							/>
						)}
					</SimpleGrid>

					<Group mt={32}>
						<Box>
							<PrimaryTitle>Metrics</PrimaryTitle>
							<Text>View and track instance activity metrics</Text>
						</Box>

						<Spacer />

						<Select
							placeholder="Duration"
							size="sm"
							value={metricsDuration}
							onChange={(e) => setMetricsDuration((e as MetricsDuration) ?? "hour")}
							data={[
								{ value: "hour", label: "Last Hour" },
								{ value: "half", label: "Last 12 Hours" },
								{ value: "day", label: "Last Day" },
								{ value: "week", label: "Last Week" },
								{ value: "month", label: "Last Month" },
							]}
							leftSection={<Icon path={iconClock} />}
							rightSection={<Icon path={iconChevronDown} />}
							rightSectionWidth={30}
						/>
					</Group>

					<SimpleGrid
						cols={2}
						spacing="xl"
					>
						<NetworkIngressChart
							metrics={networkIngressMetrics}
							duration={metricsDuration}
							isLoading={networkIngressMetricsPending}
						/>
						<NetworkEgressChart
							metrics={networkEgressMetrics}
							duration={metricsDuration}
							isLoading={networkEgressMetricsPending}
						/>
						<MemoryUsageChart
							metrics={memoryMetrics}
							duration={metricsDuration}
							isLoading={memoryMetricsPending}
						/>
						<ComputeActivityChart
							metrics={cpuMetrics}
							duration={metricsDuration}
							isLoading={cpuMetricsPending}
						/>
					</SimpleGrid>

					<Box mt={32}>
						<PrimaryTitle>Resources</PrimaryTitle>
						<Text>Monitor and explore instance resources</Text>
					</Box>

					<SimpleGrid
						cols={3}
						spacing="xl"
					>
						<ComputeUsageBlockLazy
							usage={usage}
							isLoading={isLoading}
						/>
						<DiskUsageBlockLazy
							usage={usage}
							instance={details}
							isLoading={isLoading}
						/>
						<BackupsBlockLazy
							instance={details}
							backups={backups}
							isLoading={isLoading}
							onUpgrade={handleUpgrade}
						/>
					</SimpleGrid>
				</Stack>
			</ScrollArea>

			{details && (
				<ConfiguratorDrawerLazy
					opened={configuring}
					tab={activeTab}
					instance={details}
					onChangeTab={setActiveTab}
					onClose={configureHandle.close}
					onUpdate={handleUpdate}
				/>
			)}
		</Box>
	);
}

export default DashboardView;
