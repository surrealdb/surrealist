import {
	Box,
	Button,
	Center,
	CopyButton,
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
	UnstyledButton,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { memo, useEffect, useState } from "react";
import { useImmer } from "use-immer";
import { Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import cloudUrl from "~/assets/images/icons/cloud.webp";
import communtyUrl from "~/assets/images/icons/community.webp";
import documentationUrl from "~/assets/images/icons/document.webp";
import tutorialsUrl from "~/assets/images/icons/tutorials.webp";
import { isOrganisationBillable } from "~/cloud/helpers";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationQuery } from "~/cloud/queries/organizations";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { Icon } from "~/components/Icon";
import { InstanceActions } from "~/components/InstanceActions";
import { Link } from "~/components/Link";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useConnection, useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useStable } from "~/hooks/stable";
import { openBillingRequiredModal } from "~/modals/billing-required";
import { activateDatabase, executeQuery } from "~/screens/surrealist/connection/connection";
import { ComputeUsageChart } from "~/screens/surrealist/metrics/ComputeUsageChart";
import { MemoryUsageChart } from "~/screens/surrealist/metrics/MemoryUsageChart";
import { NetworkEgressChart } from "~/screens/surrealist/metrics/NetworkEgressChart";
import { NetworkIngressChart } from "~/screens/surrealist/metrics/NetworkIngressChart";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { useDatabaseStore } from "~/stores/database";
import { useDeployStore } from "~/stores/deploy";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { iconCheck, iconChevronDown, iconChevronRight, iconCopy } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { APPLY_DATA_FILE_KEY, APPLY_DATASET_KEY } from "~/util/storage";
import { MonitorMetricOptions } from "../../monitor/helpers";
import { MetricActions } from "../../monitor/MetricPane/actions";
import { BackupsBlock } from "../BackupsBlock";
import { BackupsDrawer } from "../BackupsDrawer";
import { ComputeHoursBlock } from "../ComputeHoursBlock";
import { ConfigurationBlock } from "../ConfigurationBlock";
import { ConfiguratorDrawer } from "../ConfiguratorDrawer";
import { ConnectBlock } from "../ConnectBlock";
import { DiskUsageBlock } from "../DiskUsageBlock";
import { MajorUpdateSection } from "../MajorUpdateSection";
import { NavigationBlock } from "../NavigationBlock";
import { ResumeBlock } from "../ResumeBlock";
import { UpdateBlock } from "../UpdateBlock";
import { UpgradeDrawer } from "../UpgradeDrawer";
import classes from "./style.module.scss";

const MajorUpdateSectionLazy = memo(MajorUpdateSection);
const UpdateBlockLazy = memo(UpdateBlock);
const ResumeBlockLazy = memo(ResumeBlock);
const ConfigurationBlockLazy = memo(ConfigurationBlock);
const ConnectBlockLazy = memo(ConnectBlock);
const ComputeUsageBlockLazy = memo(ComputeHoursBlock);
const DiskUsageBlockLazy = memo(DiskUsageBlock);
const BackupsBlockLazy = memo(BackupsBlock);
const ConfiguratorDrawerLazy = memo(ConfiguratorDrawer);
const BackupsDrawerLazy = memo(BackupsDrawer);
const UpgradeDrawerLazy = memo(UpgradeDrawer);
const MemoryUsageChartLazy = memo(MemoryUsageChart);
const ComputeUsageChartLazy = memo(ComputeUsageChart);
const NetworkIngressChartLazy = memo(NetworkIngressChart);
const NetworkEgressChartLazy = memo(NetworkEgressChart);

export function DashboardView() {
	const isConnected = useIsConnected();
	const [conn, isCloud, instanceId] = useConnection((c) => [
		c,
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
	]);

	const [upgrading, upgradingHandle] = useBoolean();
	const [configuring, configuringHandle] = useBoolean();
	const [backupsOpened, backupsHandle] = useBoolean();

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

	const version = useDatabaseStore((s) => s.version);
	const [applyDataset] = useDatasets();
	const { mutateAsync } = useUpdateInstanceVersionMutation(details);
	const handleUpdate = useUpdateConfirmation(mutateAsync);

	const { data, deployConnectionId, setIsDeploying, setData, setDeployConnectionId } =
		useDeployStore();

	const applyInitialDataset = useStable(async () => {
		try {
			showNotification({
				title: "Importing data",
				message: "Importing datataset file...",
			});

			await executeQuery(
				"DEFINE NAMESPACE demo; USE NS demo; DEFINE DATABASE surreal_deal_store;",
			);

			await activateDatabase("demo", "surreal_deal_store");
			await applyDataset(version);
		} catch (error) {
			showErrorNotification({
				title: "Failed to apply dataset",
				content: error,
			});
		}
	});

	const applyInitialDataFile = useStable(async () => {
		try {
			showNotification({
				title: "Importing data",
				message: "Importing data from the data file...",
			});

			await executeQuery("DEFINE NAMESPACE main; USE NS main; DEFINE DATABASE main;");
			await activateDatabase("main", "main");

			if (!data) {
				showErrorNotification({
					title: "Failed to import data",
					content: "The data file was not found",
				});

				setData("");
				setDeployConnectionId(null);
				return;
			}

			await executeQuery(data);

			setData("");
			setDeployConnectionId(null);
			showInfo({
				title: "Import finished",
				subtitle: "The data file has finished importing",
			});
		} catch (error) {
			setData("");
			setDeployConnectionId(null);
			showErrorNotification({
				title: "Failed to import data",
				content: error,
			});
		}
	});

	const importDatabase = useRequireDatabase(() => dispatchIntent("import-database"));

	// biome-ignore lint/correctness/useExhaustiveDependencies: Reset evert time the metrics duration changes
	useEffect(() => {
		setMetricOptions((draft) => {
			draft.nodeFilter = undefined;
		});
	}, [metricOptions.duration]);

	// Apply dataset on load
	// biome-ignore lint/correctness/useExhaustiveDependencies: Not needed
	useEffect(() => {
		if (details?.state === "ready" && isConnected) {
			const dataset = sessionStorage.getItem(`${APPLY_DATASET_KEY}:${details.id}`);
			const shouldApplyFile = sessionStorage.getItem(`${APPLY_DATA_FILE_KEY}:${details.id}`);

			if (dataset) {
				sessionStorage.removeItem(`${APPLY_DATASET_KEY}:${details.id}`);
				applyInitialDataset();
			}

			if (shouldApplyFile) {
				sessionStorage.removeItem(`${APPLY_DATA_FILE_KEY}:${details.id}`);
				importDatabase();
			}

			if (data && deployConnectionId === conn?.id) {
				applyInitialDataFile();
			}

			setIsDeploying(false);
		}
	}, [details?.state, details, isConnected, importDatabase]);

	const handleUpgradeType = useStable(() => {
		if (!organisation) return;

		setUpgradeTab("type");

		if (organisation.resources_locked) {
			openResourcesLockedModal(organisation);
		} else {
			if (isOrganisationBillable(organisation)) {
				upgradingHandle.open();
			} else {
				openBillingRequiredModal({
					organization: organisation,
					onClose: () => {},
					onContinue: () => {
						upgradingHandle.open();
					},
				});
			}
		}
	});

	const handleUpgradeStorage = useStable(() => {
		if (!organisation) return;

		setUpgradeTab("disk");

		if (organisation.resources_locked) {
			openResourcesLockedModal(organisation);
		} else {
			if (isOrganisationBillable(organisation)) {
				upgradingHandle.open();
			} else {
				openBillingRequiredModal({
					organization: organisation,
					onClose: () => {},
					onContinue: () => {
						upgradingHandle.open();
					},
				});
			}
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

	const hasMajorUpdate = true;

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
									<MajorUpdateSectionLazy
										instance={details}
										organisation={organisation}
									/>

									<Box mt={32}>
										<PrimaryTitle>Your instance</PrimaryTitle>
										<Text>
											Customise and connect to your SurrealDB Cloud instance
										</Text>
									</Box>

									<UpdateBlockLazy
										instance={details}
										organisation={organisation}
										isLoading={isLoading}
										onUpdate={handleUpdate}
										onVersions={handleVersions}
									/>

									<CopyButton value={`https://${details.host}/`}>
										{({ copied, copy }) => (
											<UnstyledButton onClick={copy}>
												<Paper
													bg={
														copied
															? "var(--mantine-color-violet-light)"
															: "var(--mantine-color-slate-light)"
													}
													withBorder={false}
													p={8}
												>
													<Group
														gap={8}
														wrap="nowrap"
													>
														<Icon
															path={copied ? iconCheck : iconCopy}
															opacity={0.66}
														/>
														<Text>
															<Text span>https://</Text>
															<Text
																span
																c="bright"
															>
																{details.host}
															</Text>
															<Text span>/</Text>
														</Text>

														{copied && (
															<Text
																c="bright"
																opacity={0.66}
															>
																Copied!
															</Text>
														)}
													</Group>
												</Paper>
											</UnstyledButton>
										)}
									</CopyButton>

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
											onOpenBackups={backupsHandle.open}
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
					<BackupsDrawerLazy
						opened={backupsOpened}
						backups={backups}
						instance={details}
						onClose={backupsHandle.close}
					/>
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
				<PrimaryTitle>Deploying your SurrealDB Cloud instance...</PrimaryTitle>

				<Text
					fz="xl"
					mt="sm"
				>
					While you wait, feel free to explore SurrealDB Cloud
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
					description="Learn more about SurrealDB Cloud features and capabilities."
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
					description="Watch a quick tutorial to get started with SurrealDB Cloud."
					image={tutorialsUrl}
					href="https://www.youtube.com/watch?v=S04qOKkVcmE"
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
