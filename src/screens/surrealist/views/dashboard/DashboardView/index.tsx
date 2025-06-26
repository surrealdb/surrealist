import classes from "./style.module.scss";

import cloudUrl from "~/assets/images/icons/cloud.webp";
import communtyUrl from "~/assets/images/icons/community.webp";
import documentationUrl from "~/assets/images/icons/document.webp";
import tutorialsUrl from "~/assets/images/icons/tutorials.webp";

import {
	Button,
	Center,
	Checkbox,
	Group,
	Image,
	Indicator,
	Loader,
	Menu,
	Paper,
	Select,
	SimpleGrid,
	Skeleton,
	Text,
	Tooltip,
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
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { InstanceActions } from "~/components/InstanceActions";
import { Link } from "~/components/Link";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useBoolean } from "~/hooks/boolean";
import { useConnection } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useStable } from "~/hooks/stable";
import { activateDatabase, executeQuery } from "~/screens/surrealist/connection/connection";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { MetricsDuration } from "~/types";
import { showErrorNotification } from "~/util/helpers";
import { iconChevronDown, iconClock, iconFilter } from "~/util/icons";
import { APPLY_DATASET_KEY } from "~/util/storage";
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
import { BillingRequiredModal } from "./BillingRequiredModal";

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
	const [isCloud, instanceId] = useConnection((c) => [
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
	]);

	const [upgrading, upgradingHandle] = useBoolean();
	const [configuring, configuringHandle] = useBoolean();
	const [metricsNodes, setMetricsNodes] = useInputState<string[]>([]);
	const [billingRequiredOpened, setBillingRequiredOpened] = useState(false);
	const [metricsNodeFilter, setMetricsNodeFilter] = useInputState<string[] | undefined>(
		undefined,
	);

	const [upgradeTab, setUpgradeTab] = useState("type");
	const [configuratorTab, setConfiguratorTab] = useState("capabilities");
	const [metricsDuration, setMetricsDuration] = useInputState<MetricsDuration>("hour");

	const { data: instance, isPending: instancePending } = useCloudInstanceQuery(instanceId);
	const { data: usage, isPending: usagePending } = useCloudUsageQuery(instanceId);
	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instanceId);
	const { data: backups, isPending: backupsPending } = useCloudBackupsQuery(instanceId);
	const { data: organisation, isPending: organisationPending } = useCloudOrganizationQuery(
		details?.organization_id,
	);

	const { data: networkIngressMetrics, isPending: networkIngressMetricsPending } =
		useCloudMetricsQuery(instanceId, "ingress", metricsDuration);

	const { data: networkEgressMetrics, isPending: networkEgressMetricsPending } =
		useCloudMetricsQuery(instanceId, "egress", metricsDuration);

	const { data: memoryMetrics, isPending: memoryMetricsPending } = useCloudMetricsQuery(
		instanceId,
		"memory",
		metricsDuration,
	);

	const { data: cpuMetrics, isPending: cpuMetricsPending } = useCloudMetricsQuery(
		instanceId,
		"cpu",
		metricsDuration,
	);

	const [, applyDataset] = useDatasets();
	const { mutateAsync } = useUpdateInstanceVersionMutation(details);
	const handleUpdate = useUpdateConfirmation(mutateAsync);

	const applyInitialDataset = useStable(async (dataset: string) => {
		try {
			await executeQuery(
				"DEFINE NAMESPACE demo; USE NS demo; DEFINE DATABASE surreal_deal_store;",
			);

			await activateDatabase("demo", "surreal_deal_store");
			await applyDataset(dataset);
		} catch (error) {
			showErrorNotification({
				title: "Failed to apply dataset",
				content: error,
			});
		}
	});

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

	// Apply dataset on load
	useEffect(() => {
		if (details?.state === "ready") {
			const dataset = sessionStorage.getItem(`${APPLY_DATASET_KEY}:${details.id}`);

			if (dataset) {
				sessionStorage.removeItem(`${APPLY_DATASET_KEY}:${details.id}`);
				applyInitialDataset(dataset);
			}
		}
	}, [details?.state, details?.id]);

	const handleUpgradeType = useStable(() => {
		setUpgradeTab("type");

		if (organisation?.billing_info && organisation?.payment_info) {
			upgradingHandle.open();
		} else {
			setBillingRequiredOpened(true);
		}
	});

	const handleUpgradeStorage = useStable(() => {
		setUpgradeTab("disk");

		if (organisation?.billing_info && organisation?.payment_info) {
			upgradingHandle.open();
		} else {
			setBillingRequiredOpened(true);
		}
	});

	const handleConfigure = useStable(() => {
		setConfiguratorTab("capabilities");
		configuringHandle.open();
	});

	const handleVersions = useStable(() => {
		setConfiguratorTab("version");
		configuringHandle.open();
	});

	const isLoading =
		detailsPending ||
		backupsPending ||
		instancePending ||
		usagePending ||
		organisationPending ||
		networkIngressMetricsPending ||
		networkEgressMetricsPending ||
		memoryMetricsPending ||
		cpuMetricsPending;

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
			<TopGlow offset={318} />

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
					{details?.state === "creating" ? (
						<LoadingScreen />
					) : (
						<>
							<Box mb={18}>
								{isLoading ? (
									<Skeleton
										width={350}
										h={12}
									/>
								) : (
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
								)}
								{isLoading ? (
									<Skeleton
										mt="sm"
										width={200}
										h={50}
									/>
								) : (
									<Group mt="sm">
										<PrimaryTitle fz={32}>{details?.name}</PrimaryTitle>
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
									<Group gap="lg">
										<PrimaryTitle>Metrics</PrimaryTitle>
										{instance?.state === "ready" && (
											<Tooltip label="Metrics update live every 60 seconds">
												<Indicator
													processing={true}
													size={10}
												/>
											</Tooltip>
										)}
									</Group>

									<Text>View and track instance activity metrics</Text>
								</Box>

								<Spacer />

								<Select
									placeholder="Duration"
									size="sm"
									value={metricsDuration}
									onChange={(e) =>
										setMetricsDuration((e as MetricsDuration) ?? "hour")
									}
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
													metricsNodes.every((n) =>
														metricsNodeFilter.includes(n),
													)
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
																if (
																	metricsNodeFilter === undefined
																) {
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
									isLoading={isLoading}
								/>
								<ComputeUsageChart
									metrics={cpuMetrics}
									duration={metricsDuration}
									nodeFilter={metricsNodeFilter}
									isLoading={isLoading}
								/>
								<NetworkIngressChart
									metrics={networkIngressMetrics}
									duration={metricsDuration}
									nodeFilter={metricsNodeFilter}
									isLoading={isLoading}
								/>
								<NetworkEgressChart
									metrics={networkEgressMetrics}
									duration={metricsDuration}
									nodeFilter={metricsNodeFilter}
									isLoading={isLoading}
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
						</>
					)}
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
					<BillingRequiredModal
						opened={billingRequiredOpened}
						organization={organisation}
						onClose={() => setBillingRequiredOpened(false)}
						onContinue={() => {
							upgradingHandle.open();
						}}
					/>
				</>
			)}
		</Box>
	);
}

function LoadingScreen() {
	return (
		<>
			<Center
				className={classes.provisionBox}
				pos="relative"
				mx="auto"
				w={112}
				h={112}
				mt={64}
			>
				<Loader
					className={classes.provisionLoader}
					inset={0}
					size="100%"
					pos="absolute"
				/>
				<Image
					className={classes.provisionIcon}
					src={cloudUrl}
					w={82}
					h={82}
					mt={-8}
				/>
			</Center>

			<Box
				ta="center"
				my={38}
			>
				<PrimaryTitle>Deploying your Surreal Cloud instance...</PrimaryTitle>

				<Text
					fz="xl"
					mt="sm"
				>
					While you wait, feel free to explore Surreal Cloud
				</Text>
			</Box>

			<SimpleGrid
				cols={{ base: 1, md: 3 }}
				spacing="xl"
				mx="auto"
				maw={900}
			>
				<GettingStartedLink
					title="Cloud Documentation"
					description="Learn more about Surreal Cloud features and capabilities."
					image={documentationUrl}
					href="https://surrealdb.com/docs/cloud"
				/>
				<GettingStartedLink
					title="Join the Community"
					description="Get help from the community and share your experiences."
					image={communtyUrl}
					href="https://surrealdb.com/community"
				/>
				<GettingStartedLink
					title="Quick Start Tutorial"
					description="Watch a quick tutorial to get started with Surreal Cloud."
					image={tutorialsUrl}
					href="https://www.youtube.com/watch?v=upm1lwaHmwU"
				/>
			</SimpleGrid>
		</>
	);
}

interface GettingStartedLinkProps {
	image: string;
	title: string;
	description: string;
	href: string;
}

function GettingStartedLink({ image, description, title, href }: GettingStartedLinkProps) {
	return (
		<Link
			href={href}
			underline={false}
			c="unset"
		>
			<Paper
				p="md"
				radius="md"
				variant="interactive"
			>
				<Group wrap="nowrap">
					<Image
						src={image}
						w={52}
						h={52}
					/>
					<Box>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{title}
						</Text>
						<Text mt="xs">{description}</Text>
					</Box>
				</Group>
			</Paper>
		</Link>
	);
}

export default DashboardView;
