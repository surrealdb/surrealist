import {
	Badge,
	Button,
	Group,
	HoverCard,
	Image,
	Menu,
	Modal,
	Select,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { INSTANCE_PLAN_SUGGESTIONS, isOrganisationBillable } from "~/cloud/helpers";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { useInstanceDeployMutation } from "~/cloud/mutations/deploy";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { ActionBar } from "~/components/ActionBar";
import { ActionButton } from "~/components/ActionButton";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { SidebarToggle } from "~/components/SidebarToggle";
import { Spacer } from "~/components/Spacer";
import { StarSparkles } from "~/components/StarSparkles";
import { REGION_FLAGS, SANDBOX } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useAvailableInstanceVersions, useIsAuthenticated } from "~/hooks/cloud";
import { useConnection, useIsConnected, useMinimumVersion } from "~/hooks/connection";
import { useDatasets } from "~/hooks/dataset";
import { useConnectionNavigator } from "~/hooks/routing";
import { useTableNames } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openBillingRequiredModal } from "~/modals/billing-required";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { useDeployStore } from "~/stores/deploy";
import { useInterfaceStore } from "~/stores/interface";
import { CloudDeployConfig, DatasetType } from "~/types";
import { getConnectionById } from "~/util/connection";
import { useFeatureFlags } from "~/util/feature-flags";
import { showErrorNotification, showInfo } from "~/util/helpers";
import {
	iconCheck,
	iconChevronRight,
	iconCloud,
	iconReset,
	iconStar,
	iconTable,
} from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { generateRandomName } from "~/util/random";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { DatabaseList } from "./components/DatabaseList";
import { NamespaceList } from "./components/NamespaceList";
import { requestDatabaseExport, resetConnection } from "./connection/connection";

export function SurrealistToolbar() {
	const { readChangelog } = useInterfaceStore.getState();
	const { updateConnection } = useConfigStore.getState();
	const [flags] = useFeatureFlags();

	const navigateConnection = useConnectionNavigator();
	const isAuthenticated = useIsAuthenticated();
	const showChangelog = useInterfaceStore((s) => s.showChangelogAlert);
	const hasReadChangelog = useInterfaceStore((s) => s.hasReadChangelog);
	const authState = useCloudStore((s) => s.authState);
	const isConnected = useIsConnected();

	const [id, namespace, authMode] = useConnection((c) => [
		c?.id,
		c?.lastNamespace,
		c?.authentication.mode,
	]);

	const [opened, openHandle] = useBoolean(false);

	const { data: organizations = [] } = useCloudOrganizationsQuery();
	const {
		organization,
		region,
		setOrganization,
		setRegion,
		isDeploying,
		setDeployConnectionId,
		setIsDeploying,
		setData,
	} = useDeployStore();

	const { data: instances = [] } = useCloudOrganizationInstancesQuery(organization?.id ?? "");
	const allRegions = useCloudStore((s) => s.regions);

	const versions = useAvailableInstanceVersions();
	const deployMutation = useInstanceDeployMutation(organization ?? undefined);
	const instanceTypes = useInstanceTypeRegistry(organization ?? undefined);
	const freeCount = instances.filter((instance) => instance.type.price_hour === 0).length;
	const isBillable = isOrganisationBillable(organization ?? undefined);
	const allowFree = freeCount < (organization?.max_free_instances ?? 0);

	// Find the cheapest possible plan available to the user
	const type = allowFree
		? instanceTypes.get("free")
		: instanceTypes.get(INSTANCE_PLAN_SUGGESTIONS.start[0]);

	const regionSet = new Set(organization?.plan?.regions ?? []);
	const supportedRegions = allRegions.filter((region) => regionSet.has(region.slug));
	const regionList = supportedRegions.map((region) => ({
		value: region.slug,
		label: region.description,
	}));

	// biome-ignore lint/correctness/useExhaustiveDependencies: Not necessary
	useEffect(() => {
		if (!organization && organizations.length > 0) {
			setOrganization(organizations[0]);
		}

		if (!region && supportedRegions.length > 0) {
			setRegion(supportedRegions[0] ?? null);
		}
	}, [organization, region, organizations, supportedRegions]);

	const [editingTab, setEditingTab] = useState<string | null>(null);
	const [tabName, setTabName] = useState("");

	const closeEditingTab = useStable(() => {
		setEditingTab(null);
	});

	const tables = useTableNames();

	const saveTabName = useStable(() => {
		if (!editingTab) return;

		updateConnection({
			id: editingTab,
			name: tabName,
		});

		closeEditingTab();
	});

	const resetSandbox = useConfirmation({
		title: "Reset sandbox environment",
		message:
			"This will clear all data and query responses. Your queries will not be affected. Are you sure you want to continue?",
		skippable: true,
		confirmText: "Reset",
		confirmProps: { variant: "gradient" },
		onConfirm: resetConnection,
	});

	const [datasets, applyDataset, isDatasetLoading] = useDatasets();

	const openChangelog = useStable(() => {
		dispatchIntent("open-changelog");
		readChangelog();
	});

	const [isSupported, version] = useMinimumVersion(import.meta.env.SDB_VERSION);
	const isSandbox = id === "sandbox";
	const showNS = !isSandbox && id && isConnected;
	const showDB = showNS && namespace;

	return (
		<>
			<SidebarToggle />

			<ConnectionStatus />

			{authState === "unauthenticated" && authMode === "cloud" && (
				<Button
					variant="gradient"
					size="xs"
					onClick={openCloudAuthentication}
				>
					Sign in to SurrealDB Cloud
				</Button>
			)}

			{showNS && (
				<>
					<Icon
						path={iconChevronRight}
						size="xl"
						color="slate.5"
						mx={-8}
					/>

					<NamespaceList />
				</>
			)}

			{showDB && (
				<>
					<Icon
						path={iconChevronRight}
						size="xl"
						color="slate.5"
						mx={-8}
					/>

					<DatabaseList />
				</>
			)}

			{isConnected && isSandbox && (
				<>
					<ActionButton
						color="slate"
						variant="subtle"
						label="Reset sandbox environment"
						onClick={resetSandbox}
					>
						<Icon path={iconReset} />
					</ActionButton>
					<Menu
						transitionProps={{
							transition: "scale-y",
						}}
					>
						<Menu.Target>
							<div>
								<ActionButton
									color="slate"
									variant="subtle"
									label="Apply demo dataset"
									loading={isDatasetLoading}
								>
									<Icon path={iconTable} />
								</ActionButton>
							</div>
						</Menu.Target>
						<Menu.Dropdown miw={200}>
							<Menu.Label>Select a dataset</Menu.Label>
							{datasets.map(({ label, value }) => (
								<Menu.Item
									key={value}
									onClick={() => applyDataset(value as DatasetType)}
								>
									{label}
								</Menu.Item>
							))}
						</Menu.Dropdown>
					</Menu>

					<StarSparkles>
						{isAuthenticated && (
							<Menu
								disabled={isDeploying}
								opened={opened}
								onChange={openHandle.set}
								transitionProps={{
									transition: "scale-y",
								}}
								closeOnItemClick={false}
								clickOutsideEvents={[]}
								trigger="click"
							>
								<Menu.Target>
									<Button
										variant="gradient"
										size="xs"
										loading={isDeploying}
									>
										Deploy to Cloud
									</Button>
								</Menu.Target>
								<Menu.Dropdown p="md">
									<Stack gap="md">
										{organizations.length > 1 && (
											<Select
												label="Select organization"
												placeholder="Loading organizations..."
												description="Select the organization to deploy to"
												data={organizations.map((org) => ({
													label: org.name,
													value: org.id,
												}))}
												value={organization?.id}
												onChange={(value) =>
													setOrganization(
														value
															? (organizations.find(
																	(org) => org.id === value,
																) ?? null)
															: null,
													)
												}
											/>
										)}

										<Select
											label="Region"
											placeholder="Loading regions..."
											description="Select the region where your instance will be deployed"
											data={regionList}
											value={region?.slug}
											onChange={(value) => {
												const foundRegion = supportedRegions.find(
													(r) => r.slug === value,
												);

												if (foundRegion) {
													setRegion(foundRegion);
												}
											}}
											leftSection={
												region && (
													<Image
														src={REGION_FLAGS[region.slug]}
														w={18}
													/>
												)
											}
											disabled={!organization}
											renderOption={(org) => (
												<Group>
													<Image
														src={REGION_FLAGS[org.option.value]}
														w={24}
													/>
													{org.option.label}
													{org.checked && (
														<Icon
															path={iconCheck}
															c="bright"
														/>
													)}
												</Group>
											)}
										/>

										<Group gap="md">
											<Button
												flex={1}
												color="slate"
												variant="light"
												size="xs"
												onClick={() => {
													openHandle.close();
												}}
											>
												Close
											</Button>
											<Button
												flex={1}
												variant="gradient"
												size="xs"
												disabled={!organization || !region}
												loading={isDeploying}
												rightSection={<Icon path={iconCloud} />}
												onClick={async () => {
													openHandle.close();

													setIsDeploying(true);

													showInfo({
														title: "Deploying to cloud",
														subtitle: "Exporting database...",
													});

													try {
														const blob = await requestDatabaseExport({
															accesses: true,
															analyzers: true,
															functions: true,
															params: true,
															users: true,
															versions: false,
															records: true,
															sequences: true,
															tables,
														});

														const result = await blob.text();

														if (!result) {
															showErrorNotification({
																title: "Failed to deploy to cloud",
																content:
																	"The database export was empty",
															});
															setIsDeploying(false);
															return;
														}

														const file = new File([result], "", {
															type: "text/plain",
														});

														if (!file) {
															showErrorNotification({
																title: "Failed to deploy to cloud",
																content:
																	"The data file was not stored",
															});
															setIsDeploying(false);
															return;
														} else {
															setData(file);
														}

														const deployInstance = async () => {
															if (!isBillable && !allowFree) {
																showErrorNotification({
																	title: "Deployment cancelled",
																	content:
																		"Billing information is required to deploy a paid instance.",
																});

																setDeployConnectionId(null);
																setIsDeploying(false);
																setData(null);
																return;
															} else if (
																!organization ||
																!region ||
																!type
															) {
																showErrorNotification({
																	title: "Deployment cancelled",
																	content:
																		"Organization, region, and type are required to deploy an instance.",
																});

																setIsDeploying(false);
																setData(null);
																setDeployConnectionId(null);
																return;
															}

															try {
																const config: CloudDeployConfig = {
																	name: generateRandomName(),
																	version: versions[0],
																	region: region?.slug ?? "",
																	type: type.slug ?? "",
																	units: 1,
																	plan: allowFree
																		? "free"
																		: "start",
																	storageCategory: "standard",
																	storageAmount:
																		type.default_storage_size,
																	startingData: { type: "none" },
																};

																const sandbox =
																	getConnectionById(SANDBOX);

																if (!sandbox) {
																	showErrorNotification({
																		title: "Deployment failed",
																		content:
																			"Sandbox connection not found",
																	});

																	setIsDeploying(false);
																	return;
																}

																const [_, conn] =
																	await deployMutation.mutateAsync(
																		config,
																	);

																updateConnection({
																	id: conn.id,
																	activeQuery:
																		sandbox.activeQuery,
																	queries: sandbox.queries,
																});

																setDeployConnectionId(conn.id);
																setIsDeploying(false);
																setOrganization(null);
																setRegion(null);
																navigateConnection(
																	conn.id,
																	"dashboard",
																);
															} catch (error) {
																showErrorNotification({
																	title: "Deployment failed",
																	content: error,
																});
															}
														};

														if (!isBillable && !allowFree) {
															if (organization) {
																openBillingRequiredModal({
																	organization,
																	onClose: () => {
																		setIsDeploying(false);
																		setData(null);
																		setDeployConnectionId(null);

																		showErrorNotification({
																			title: "Deployment failed",
																			content:
																				"Payment information is required",
																		});
																	},
																	onContinue: () => {
																		deployInstance();
																	},
																});
															}
														} else {
															deployInstance();
														}
													} catch (error) {
														showErrorNotification({
															title: "Deployment failed",
															content: error,
														});
														setIsDeploying(false);
													}
												}}
											>
												Deploy
											</Button>
										</Group>
									</Stack>
								</Menu.Dropdown>
							</Menu>
						)}
						{!isAuthenticated && (
							<Button
								variant="gradient"
								size="xs"
								onClick={openCloudAuthentication}
							>
								Deploy to Cloud
							</Button>
						)}
					</StarSparkles>
				</>
			)}

			{isConnected && !isSupported && (
				<HoverCard>
					<HoverCard.Target>
						<Badge
							variant="light"
							color="orange"
							h={28}
						>
							Unsupported database version
						</Badge>
					</HoverCard.Target>
					<HoverCard.Dropdown>
						<Text>
							We recommend using at least{" "}
							<Text
								span
								c="bright"
							>
								SurrealDB {import.meta.env.SDB_VERSION}
							</Text>
						</Text>
						<Text>
							The current version is{" "}
							<Text
								span
								c="bright"
							>
								SurrealDB {version}
							</Text>
						</Text>
					</HoverCard.Dropdown>
				</HoverCard>
			)}

			<Spacer />

			{(flags.changelog === "auto" ? showChangelog : flags.changelog !== "hidden") && (
				<Button
					h={34}
					size="xs"
					radius="xs"
					color="slate"
					variant={
						(flags.changelog === "auto" ? hasReadChangelog : flags.changelog === "read")
							? "filled"
							: "gradient"
					}
					style={{ border: "none" }}
					onClick={openChangelog}
					leftSection={
						<Icon
							path={iconStar}
							left
						/>
					}
				>
					See what's new in {import.meta.env.VERSION}
				</Button>
			)}

			<ActionBar />

			<Modal
				opened={!!editingTab}
				onClose={closeEditingTab}
			>
				<Form onSubmit={saveTabName}>
					<Group>
						<TextInput
							style={{ flex: 1 }}
							placeholder="Enter tab name"
							value={tabName}
							spellCheck={false}
							onChange={(e) => setTabName(e.target.value)}
							autoFocus
							onFocus={(e) => e.target.select()}
						/>
						<Button type="submit">Rename</Button>
					</Group>
				</Form>
			</Modal>
		</>
	);
}
