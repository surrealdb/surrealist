import classes from "./style.module.scss";

import {
	Button,
	Checkbox,
	Group,
	Indicator,
	Menu,
	Select,
	SimpleGrid,
	Skeleton,
	Text,
} from "@mantine/core";
import { Box, ScrollArea, Stack } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { memo, useEffect, useState } from "react";
import { Redirect } from "wouter";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudMetricsQuery } from "~/cloud/queries/metrics";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useBoolean } from "~/hooks/boolean";
import { useConnection } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { MetricsDuration } from "~/types";
import { iconChevronDown, iconClock, iconFilter } from "~/util/icons";
import { BackupsBlock } from "../BackupsBlock";
import { ComputeHoursBlock } from "../ComputeHoursBlock";
import { ComputeUsageChart } from "../ComputeUsageChart";
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
import { UpgradeDrawer } from "../UpgradeDrawer";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { InstanceActions } from "~/components/InstanceActions";

const UpdateBlockLazy = memo(UpdateBlock);
const ResumeBlockLazy = memo(ResumeBlock);
const ConfigurationBlockLazy = memo(ConfigurationBlock);
const ConnectBlockLazy = memo(ConnectBlock);
const ComputeUsageBlockLazy = memo(ComputeHoursBlock);
const DiskUsageBlockLazy = memo(DiskUsageBlock);
const BackupsBlockLazy = memo(BackupsBlock);
const ConfiguratorDrawerLazy = memo(ConfiguratorDrawer);
const UpgradeDrawerLazy = memo(UpgradeDrawer);

export function DashboardView() {
	const [isCloud, instance] = useConnection((c) => [
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
	]);

	const { mutateAsync } = useUpdateInstanceVersionMutation(instance);
	const handleUpdate = useUpdateConfirmation(mutateAsync);

	const [upgrading, upgradingHandle] = useBoolean();
	const [configuring, configuringHandle] = useBoolean();
	const [metricsNodes, setMetricsNodes] = useInputState<string[]>([]);
	const [metricsNodeFilter, setMetricsNodeFilter] = useInputState<string[] | undefined>(
		undefined,
	);

	const [upgradeTab, setUpgradeTab] = useState("type");
	const [configuratorTab, setConfiguratorTab] = useState("capabilities");
	const [metricsDuration, setMetricsDuration] = useInputState<MetricsDuration>("hour");

	const { data: usage, isPending: usagePending } = useCloudUsageQuery(instance);
	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instance);
	const { data: backups, isPending: backupsPending } = useCloudBackupsQuery(instance);
	const { data: organisation, isPending: organisationPending } = useCloudOrganizationQuery(
		details?.organization_id,
	);

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

	useEffect(() => {
		const nodes = new Set<string>();

		if (networkIngressMetrics) {
			for (const m of networkIngressMetrics.values.metrics) {
				nodes.add(m.labels);
			}
		}

		if (networkEgressMetrics) {
			for (const m of networkEgressMetrics.values.metrics) {
				nodes.add(m.labels);
			}
		}

		if (memoryMetrics) {
			for (const m of memoryMetrics.values.metrics) {
				nodes.add(m.labels);
			}
		}

		if (cpuMetrics) {
			for (const m of cpuMetrics.values.metrics) {
				nodes.add(m.labels);
			}
		}

		setMetricsNodes(Array.from(nodes));
	}, [networkIngressMetrics, networkEgressMetrics, memoryMetrics, cpuMetrics]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset evert time the metrics duration changes
	useEffect(() => {
		setMetricsNodeFilter(undefined);
	}, [metricsDuration]);

	const handleUpgradeType = useStable(() => {
		setUpgradeTab("type");
		upgradingHandle.open();
	});

	const handleUpgradeStorage = useStable(() => {
		setUpgradeTab("disk");
		upgradingHandle.open();
	});

	const handleConfigure = useStable(() => {
		setConfiguratorTab("capabilities");
		configuringHandle.open();
	});

	const handleVersions = useStable(() => {
		setConfiguratorTab("version");
		configuringHandle.open();
	});

	const isLoading = detailsPending || backupsPending || usagePending || organisationPending;

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
					style: { paddingBottom: 75 },
				}}
			>
				<Stack
					px="xl"
					mx="auto"
					maw={1200}
					mt={22}
				>
					<Box mb={18}>
						<Skeleton
							visible={isLoading}
							width={isLoading ? 350 : undefined}
						>
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{ label: "Organisations", href: "/organisations" },
									{
										label: organisation?.name ?? "",
										href: `/o/${details?.organization_id}`,
									},
									{ label: details?.name ?? "" },
								]}
							/>
						</Skeleton>
						<Group mt="sm">
							<Skeleton
								visible={isLoading}
								width={isLoading ? 200 : "max-content"}
							>
								<PrimaryTitle fz={32}>{details?.name ?? "_"}</PrimaryTitle>
							</Skeleton>
							{details?.state && (
								<StateBadge
									size={14}
									state={details.state}
								/>
							)}
							<Spacer />
							{details && (
								<InstanceActions instance={details}>
									<Button
										color="violet"
										variant="light"
										rightSection={<Icon path={iconChevronDown} />}
									>
										Instance actions
									</Button>
								</InstanceActions>
							)}
						</Group>
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
							onUpgrade={handleUpgradeType}
							onConfigure={handleConfigure}
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
						<Menu>
							<Menu.Target>
								<Indicator
									disabled={
										metricsNodeFilter === undefined ||
										metricsNodeFilter.length === metricsNodes.length
									}
								>
									<ActionButton
										variant="light"
										color="slate"
										label="Node filter"
										size="lg"
									>
										<Icon
											size="md"
											path={iconFilter}
										/>
									</ActionButton>
								</Indicator>
							</Menu.Target>

							<Menu.Dropdown p="md">
								<Group>
									<Checkbox
										indeterminate={
											metricsNodeFilter !== undefined &&
											metricsNodeFilter.length > 0 &&
											!metricsNodes.every((n) =>
												metricsNodeFilter.includes(n),
											)
										}
										variant="gradient"
										checked={
											metricsNodeFilter === undefined ||
											metricsNodeFilter.length > 0 ||
											metricsNodes.every((n) => metricsNodeFilter.includes(n))
										}
										onChange={(e) => {
											const checked = e.currentTarget.checked;

											if (checked) {
												setMetricsNodeFilter(metricsNodes);
											} else {
												setMetricsNodeFilter([]);
											}
										}}
									/>
									<Text
										c="bright"
										fw={500}
										fz={13}
									>
										All nodes
									</Text>
								</Group>

								<Menu.Divider my="md" />

								<Stack>
									{metricsNodes.map((node, i) => (
										<Group key={i}>
											<Checkbox
												variant="gradient"
												checked={
													metricsNodeFilter?.includes(node) ||
													metricsNodeFilter === undefined
												}
												onChange={(e) => {
													const checked = e.currentTarget.checked;

													if (checked) {
														setMetricsNodeFilter([
															...(metricsNodeFilter ?? []),
															node,
														]);
													} else {
														if (metricsNodeFilter === undefined) {
															setMetricsNodeFilter(
																metricsNodes.filter(
																	(n) => n !== node,
																),
															);
														} else {
															setMetricsNodeFilter(
																metricsNodeFilter?.filter(
																	(n) => n !== node,
																),
															);
														}
													}
												}}
											/>
											<Text
												c="bright"
												fw={500}
											>
												{node}
											</Text>
										</Group>
									))}
								</Stack>
							</Menu.Dropdown>
						</Menu>
					</Group>

					<SimpleGrid
						cols={2}
						spacing="xl"
					>
						<MemoryUsageChart
							metrics={memoryMetrics}
							duration={metricsDuration}
							nodeFilter={metricsNodeFilter}
							isLoading={memoryMetricsPending}
						/>
						<ComputeUsageChart
							metrics={cpuMetrics}
							duration={metricsDuration}
							nodeFilter={metricsNodeFilter}
							isLoading={cpuMetricsPending}
						/>
						<NetworkIngressChart
							metrics={networkIngressMetrics}
							duration={metricsDuration}
							nodeFilter={metricsNodeFilter}
							isLoading={networkIngressMetricsPending}
						/>
						<NetworkEgressChart
							metrics={networkEgressMetrics}
							duration={metricsDuration}
							nodeFilter={metricsNodeFilter}
							isLoading={networkEgressMetricsPending}
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
							onUpgrade={handleUpgradeStorage}
						/>
						<BackupsBlockLazy
							instance={details}
							backups={backups}
							isLoading={isLoading}
							onUpgrade={handleUpgradeType}
						/>
					</SimpleGrid>
				</Stack>
			</ScrollArea>

			{details && (
				<>
					<ConfiguratorDrawerLazy
						opened={configuring}
						tab={configuratorTab}
						instance={details}
						onChangeTab={setConfiguratorTab}
						onClose={configuringHandle.close}
						onUpdate={handleUpdate}
					/>
					<UpgradeDrawerLazy
						opened={upgrading}
						instance={details}
						tab={upgradeTab}
						onChangeTab={setUpgradeTab}
						onClose={upgradingHandle.close}
					/>
				</>
			)}
		</Box>
	);
}

export default DashboardView;
