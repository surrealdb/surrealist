import {
	Box,
	Button,
	Center,
	Group,
	Image,
	Indicator,
	Loader,
	Paper,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Tooltip,
} from "@mantine/core";
import { memo, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import cloudUrl from "~/assets/images/icons/cloud.webp";
import communtyUrl from "~/assets/images/icons/community.webp";
import documentationUrl from "~/assets/images/icons/document.webp";
import tutorialsUrl from "~/assets/images/icons/tutorials.webp";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { Icon } from "~/components/Icon";
import { InstanceActions } from "~/components/InstanceActions";
import { Link } from "~/components/Link";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useConnection } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useStable } from "~/hooks/stable";
import { activateDatabase, executeQuery } from "~/screens/surrealist/connection/connection";
import { ComputeUsageChart } from "~/screens/surrealist/metrics/ComputeUsageChart";
import { MemoryUsageChart } from "~/screens/surrealist/metrics/MemoryUsageChart";
import { NetworkEgressChart } from "~/screens/surrealist/metrics/NetworkEgressChart";
import { NetworkIngressChart } from "~/screens/surrealist/metrics/NetworkIngressChart";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { showErrorNotification } from "~/util/helpers";
import { iconChevronDown, iconChevronRight } from "~/util/icons";
import { APPLY_DATASET_KEY } from "~/util/storage";
import { MonitorMetricOptions } from "../../monitor/helpers";
import { MetricActions } from "../../monitor/MetricPane/actions";
import { BackupsBlock } from "../BackupsBlock";
import { ComputeHoursBlock } from "../ComputeHoursBlock";
import { ConfigurationBlock } from "../ConfigurationBlock";
import { ConfiguratorDrawer } from "../ConfiguratorDrawer";
import { ConnectBlock } from "../ConnectBlock";
import { DiskUsageBlock } from "../DiskUsageBlock";
import { NavigationBlock } from "../NavigationBlock";
import { ResumeBlock } from "../ResumeBlock";
import { UpdateBlock } from "../UpdateBlock";
import { UpgradeDrawer } from "../UpgradeDrawer";
import { BillingRequiredModal } from "./BillingRequiredModal";
import classes from "./style.module.scss";

const UpdateBlockLazy = memo(UpdateBlock);
const ResumeBlockLazy = memo(ResumeBlock);
const ConfigurationBlockLazy = memo(ConfigurationBlock);
const ConnectBlockLazy = memo(ConnectBlock);
const ComputeUsageBlockLazy = memo(ComputeHoursBlock);
const DiskUsageBlockLazy = memo(DiskUsageBlock);
const BackupsBlockLazy = memo(BackupsBlock);
const ConfiguratorDrawerLazy = memo(ConfiguratorDrawer);
const UpgradeDrawerLazy = memo(UpgradeDrawer);
const MemoryUsageChartLazy = memo(MemoryUsageChart);
const ComputeUsageChartLazy = memo(ComputeUsageChart);
const NetworkIngressChartLazy = memo(NetworkIngressChart);
const NetworkEgressChartLazy = memo(NetworkEgressChart);

export function DashboardView() {
	const [isCloud, instanceId] = useConnection((c) => [
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
	]);

	const [upgrading, upgradingHandle] = useBoolean();
	const [configuring, configuringHandle] = useBoolean();
	const [billingRequiredOpened, setBillingRequiredOpened] = useState(false);

	const [upgradeTab, setUpgradeTab] = useState("type");
	const [configuratorTab, setConfiguratorTab] = useState("capabilities");

	const [metricOptions, setMetricOptions] = useImmer<MonitorMetricOptions>({
		duration: "hour",
		nodeFilter: undefined,
		nodes: [],
	});

	const { data: instance, isPending: instancePending } = useCloudInstanceQuery(instanceId);
	const { data: usage, isPending: usagePending } = useCloudUsageQuery(instanceId);
	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instanceId);
	const { data: backups, isPending: backupsPending } = useCloudBackupsQuery(instanceId);
	const { data: organisation, isPending: organisationPending } = useCloudOrganizationQuery(
		details?.organization_id,
	);

	const [networkIngressLabels, setNetworkIngressLabels] = useState<string[]>([]);
	const [networkEgressLabels, setNetworkEgressLabels] = useState<string[]>([]);
	const [memoryLabels, setMemoryLabels] = useState<string[]>([]);
	const [cpuLabels, setCpuLabels] = useState<string[]>([]);

	useEffect(() => {
		const nodes = new Set<string>();

		for (const label of memoryLabels) {
			nodes.add(label);
		}

		for (const label of cpuLabels) {
			nodes.add(label);
		}

		for (const label of networkEgressLabels) {
			nodes.add(label);
		}

		for (const label of networkIngressLabels) {
			nodes.add(label);
		}

		setMetricOptions((draft) => {
			draft.nodes = Array.from(nodes);
		});
	}, [memoryLabels, cpuLabels, networkEgressLabels, networkIngressLabels]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset evert time the metrics duration changes
	useEffect(() => {
		setMetricOptions((draft) => {
			draft.nodeFilter = undefined;
		});
	}, [metricOptions.duration]);

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset evert time the metrics duration changes
	useEffect(() => {
		setMetricOptions((draft) => {
			draft.nodeFilter = undefined;
		});
	}, [metricOptions.duration]);

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
		detailsPending || backupsPending || instancePending || usagePending || organisationPending;

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
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				mt={18}
			>
				<Stack
					px="xl"
					mx="auto"
					maw={1200}
					pb={68}
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
									<Group mt="sm">
										<Skeleton
											width={200}
											h={50}
										/>
										<Spacer />
										<Skeleton
											width={145}
											h={36}
										/>
									</Group>
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
										{details && organisation && (
											<InstanceActions
												instance={details}
												organisation={organisation}
											>
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

							{!isLoading && details && instance && organisation ? (
								<>
									<Box mt={32}>
										<PrimaryTitle>Your instance</PrimaryTitle>
										<Text>
											Customise and connect to your Surreal Cloud instance
										</Text>
									</Box>

									<UpdateBlockLazy
										instance={details}
										organisation={organisation}
										isLoading={isLoading}
										onUpdate={handleUpdate}
										onVersions={handleVersions}
									/>

									<SimpleGrid
										cols={2}
										spacing="xl"
									>
										<ConfigurationBlockLazy
											instance={details}
											organisation={organisation}
											isLoading={isLoading}
											onUpgrade={handleUpgradeType}
											onConfigure={handleConfigure}
										/>

										{!isLoading && details.state === "paused" ? (
											<ResumeBlockLazy
												instance={details}
												organisation={organisation}
											/>
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
												{!isLoading && instance?.state === "ready" && (
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

										<MetricActions
											options={metricOptions}
											onChange={setMetricOptions}
										/>
									</Group>

									<SimpleGrid
										cols={2}
										spacing="xl"
									>
										<MemoryUsageChartLazy
											instance={instanceId}
											duration={metricOptions.duration}
											nodeFilter={metricOptions.nodeFilter}
											onCalculateMetricsNodes={(metrics) => {
												setMemoryLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
										<ComputeUsageChartLazy
											instance={instanceId}
											duration={metricOptions.duration}
											nodeFilter={metricOptions.nodeFilter}
											onCalculateMetricsNodes={(metrics) => {
												setCpuLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
										<NetworkIngressChartLazy
											instance={instanceId}
											duration={metricOptions.duration}
											nodeFilter={metricOptions.nodeFilter}
											onCalculateMetricsNodes={(metrics) => {
												setNetworkIngressLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
										<NetworkEgressChartLazy
											instance={instanceId}
											duration={metricOptions.duration}
											nodeFilter={metricOptions.nodeFilter}
											onCalculateMetricsNodes={(metrics) => {
												setNetworkEgressLabels(
													metrics.values.metrics.map((it) => it.labels),
												);
											}}
										/>
									</SimpleGrid>
									<Group pt="xs">
										<Spacer />
										<Button
											variant="light"
											color="slate"
											rightSection={<Icon path={iconChevronRight} />}
											onClick={() => {
												navigate("monitor");
											}}
										>
											View more
										</Button>
									</Group>

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
											organisation={organisation}
											isLoading={isLoading}
											onUpgrade={handleUpgradeStorage}
										/>
										<BackupsBlockLazy
											instance={details}
											organisation={organisation}
											backups={backups}
											isLoading={isLoading}
											onUpgrade={handleUpgradeType}
										/>
									</SimpleGrid>
								</>
							) : (
								<Loader
									mx="auto"
									type="dots"
									mt={96}
								/>
							)}
						</>
					)}
				</Stack>
			</ScrollArea>

			{details && organisation && (
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
						organisation={organisation}
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
