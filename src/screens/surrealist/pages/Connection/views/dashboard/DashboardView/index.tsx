import {
	Anchor,
	Badge,
	Box,
	Button,
	Center,
	CopyButton,
	Group,
	Image,
	Indicator,
	Loader,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import {
	Icon,
	iconCheck,
	iconChevronRight,
	iconCopy,
	pictoDocument,
	pictoHandsOn,
	pictoPlay,
	pictoSDBCloud,
	SectionTitle,
} from "@surrealdb/ui";
import { memo, useEffect, useRef, useState } from "react";
import { useImmer } from "use-immer";
import { Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { isOrganisationBillable } from "~/cloud/helpers";
import { useUpdateConfirmation } from "~/cloud/hooks/confirm";
import { useUpdateInstanceVersionMutation } from "~/cloud/mutations/version";
import { useCloudBackupsQuery } from "~/cloud/queries/backups";
import { useCloudInstanceQuery } from "~/cloud/queries/instances";
import { useCloudUsageQuery } from "~/cloud/queries/usage";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { CloudGuard } from "~/components/CloudGuard";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useConnection, useIsConnected, useRequireDatabase } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useConnectionSettingsNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { openBillingRequiredModal } from "~/modals/billing-required";
import { PageContainer } from "~/screens/surrealist/components/PageContainer";
import { ComputeUsageChart } from "~/screens/surrealist/metrics/ComputeUsageChart";
import { MemoryUsageChart } from "~/screens/surrealist/metrics/MemoryUsageChart";
import { NetworkEgressChart } from "~/screens/surrealist/metrics/NetworkEgressChart";
import { NetworkIngressChart } from "~/screens/surrealist/metrics/NetworkIngressChart";
import {
	activateDatabase,
	executeQuery,
} from "~/screens/surrealist/pages/Connection/connection/connection";
import { StateBadge } from "~/screens/surrealist/pages/Overview/badge";
import { useDatabaseStore } from "~/stores/database";
import { useDeployStore } from "~/stores/deploy";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import { APPLY_DATA_FILE_KEY, APPLY_DATASET_KEY } from "~/util/storage";
import { ViewPageProps } from "../../../types";
import { MonitorMetricOptions } from "../../monitor/helpers";
import { MetricActions } from "../../monitor/MetricPane/actions";
import { BackupsBlock } from "../BackupsBlock";
import { ComputeHoursBlock } from "../ComputeHoursBlock";
import { ConfigurationBlock } from "../ConfigurationBlock";
import { ConnectBlock } from "../ConnectBlock";
import { DiskUsageBlock } from "../DiskUsageBlock";
import { MajorUpdateSection } from "../MajorUpdateSection";
import { NavigationBlock } from "../NavigationBlock";
import { ResumeBlock } from "../ResumeBlock";
import { UpdateBlock } from "../UpdateBlock";
import classes from "./style.module.scss";

const MajorUpdateSectionLazy = memo(MajorUpdateSection);
const UpdateBlockLazy = memo(UpdateBlock);
const ResumeBlockLazy = memo(ResumeBlock);
const ConfigurationBlockLazy = memo(ConfigurationBlock);
const ConnectBlockLazy = memo(ConnectBlock);
const ComputeUsageBlockLazy = memo(ComputeHoursBlock);
const DiskUsageBlockLazy = memo(DiskUsageBlock);
const BackupsBlockLazy = memo(BackupsBlock);
const MemoryUsageChartLazy = memo(MemoryUsageChart);
const ComputeUsageChartLazy = memo(ComputeUsageChart);
const NetworkIngressChartLazy = memo(NetworkIngressChart);
const NetworkEgressChartLazy = memo(NetworkEgressChart);

export function DashboardView({ instanceQuery, organisationQuery }: ViewPageProps) {
	const isConnected = useIsConnected();
	const [conn, isCloud, instanceId, connectionId] = useConnection((c) => [
		c,
		c?.authentication.mode === "cloud",
		c?.authentication.cloudInstance,
		c?.id ?? "",
	]);

	const navigateSettings = useConnectionSettingsNavigator();

	const [metricOptions, setMetricOptions] = useImmer<MonitorMetricOptions>({
		duration: "hour",
		nodeFilter: undefined,
		nodes: [],
	});

	const { data: instance, isPending: instancePending } = instanceQuery;
	const { data: organisation, isPending: organisationPending } = organisationQuery;

	const { data: usage, isPending: usagePending } = useCloudUsageQuery(instanceId);
	const { data: details, isPending: detailsPending } = useCloudInstanceQuery(instanceId);
	const { data: backups, isPending: backupsPending } = useCloudBackupsQuery(instanceId);

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

	const navigateUpgrade = useStable(() => {
		if (!organisation || !connectionId) return;

		const go = () => navigateSettings(connectionId, "compute");

		if (organisation.resources_locked) {
			openResourcesLockedModal(organisation);
		} else if (isOrganisationBillable(organisation)) {
			go();
		} else {
			openBillingRequiredModal({
				organization: organisation,
				onClose: () => {},
				onContinue: go,
			});
		}
	});

	const handleUpgradeType = navigateUpgrade;
	const handleUpgradeStorage = navigateUpgrade;

	const handleConfigure = useStable(() => {
		if (connectionId) {
			navigateSettings(connectionId, "configuration");
		}
	});

	const handleVersions = useStable(() => {
		if (connectionId) {
			navigateSettings(connectionId, "configuration");
		}
	});

	const handleOpenBackups = useStable(() => {
		if (connectionId) {
			navigateSettings(connectionId, "backups");
		}
	});

	const handleBackupPolicy = useStable(() => {
		if (connectionId) {
			navigateSettings(connectionId, "backups");
		}
	});

	const publicAccess = details?.access_type === "public" || details?.access_type === "dual";
	const privateAccess = details?.access_type === "private" || details?.access_type === "dual";
	const isLoading =
		detailsPending || backupsPending || instancePending || usagePending || organisationPending;

	if (!isCloud) {
		return <Redirect to="/query" />;
	}

	if (details?.state === "deleting") {
		return <Redirect to="/" />;
	}

	return (
		<CloudGuard>
			<PageContainer>
				{details?.state === "creating" ? (
					<LoadingScreen />
				) : (
					<>
						<Box mb={18}>
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
								<Group>
									<SectionTitle>{details?.name}</SectionTitle>
									{details?.state && (
										<StateBadge
											size={14}
											state={details.state}
										/>
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

								{organisation.privatelink_enabled ? (
									<Stack gap="xs">
										{publicAccess && (
											<HostnameEntry
												host={details.host}
												accessLabel="Public"
												accessColor="orange"
											/>
										)}
										{privateAccess && (
											<HostnameEntry
												host={details.private_host ?? ""}
												accessLabel="Private"
												accessColor="violet"
											/>
										)}
									</Stack>
								) : (
									<HostnameEntry host={details.host} />
								)}

								<SimpleGrid
									mt="md"
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
											connectionId={connectionId}
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
										color="obsidian"
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
										onOpenBackups={handleOpenBackups}
										onBackupPolicy={handleBackupPolicy}
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
			</PageContainer>
		</CloudGuard>
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
					inset={-12}
					size={112 + 24}
					pos="absolute"
				/>
				<Image
					className={classes.provisionIcon}
					src={pictoSDBCloud}
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
				className={classes.content}
			>
				<GettingStartedLink
					title="Cloud Documentation"
					description="Learn more about SurrealDB Cloud features and capabilities."
					image={pictoDocument}
					href="https://surrealdb.com/docs/manage/cloud"
				/>
				<GettingStartedLink
					title="Join the Community"
					description="Get help from the community and share your experiences."
					image={pictoHandsOn}
					href="https://surrealdb.com/community"
				/>
				<GettingStartedLink
					title="Quick Start Tutorial"
					description="Watch a quick tutorial to get started with SurrealDB Cloud."
					image={pictoPlay}
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
		<Anchor
			variant="glow"
			href={href}
		>
			<Paper
				p="md"
				radius="md"
			>
				<Group
					wrap="nowrap"
					gap="lg"
				>
					<Image
						src={image}
						w={48}
						h={48}
					/>
					<Box>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{title}
						</Text>
						<Text
							mt="xs"
							fz="sm"
						>
							{description}
						</Text>
					</Box>
				</Group>
			</Paper>
		</Anchor>
	);
}

interface HostnameEntryProps {
	host: string;
	accessColor?: string;
	accessLabel?: string;
}

function HostnameEntry({ host, accessColor, accessLabel }: HostnameEntryProps) {
	const fieldRef = useRef<HTMLDivElement>(null);

	const animate = () => {
		fieldRef.current?.animate(
			[
				{ outlineColor: "var(--mantine-color-violet-text)", outlineOffset: "0" },
				{ outlineColor: "transparent", outlineOffset: "5px" },
			],
			{
				duration: 750,
				easing: "ease-out",
			},
		);
	};

	return (
		<CopyButton value={`https://${host}/`}>
			{({ copied, copy }) => (
				<UnstyledButton
					onClick={() => {
						copy();
						animate();
					}}
				>
					<Paper
						className={classes.hostnameEntry}
						ref={fieldRef}
						p={8}
					>
						<Group
							gap={8}
							wrap="nowrap"
						>
							{accessLabel && accessColor && (
								<Badge
									color={accessColor}
									variant="light"
									h={24}
									w={72}
								>
									{accessLabel}
								</Badge>
							)}

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
									{host}
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
	);
}

export default DashboardView;
