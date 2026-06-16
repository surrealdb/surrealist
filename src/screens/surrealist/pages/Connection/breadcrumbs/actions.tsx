import {
	Badge,
	Button,
	Group,
	HoverCard,
	Image,
	Menu,
	Select,
	Stack,
	Text,
	ThemeIcon,
} from "@mantine/core";
import {
	Icon,
	iconCheck,
	iconCircleFilled,
	iconCloud,
	iconCursor,
	iconReset,
	iconTable,
} from "@surrealdb/ui";
import { useEffect } from "react";
import { INSTANCE_PLAN_SUGGESTIONS, isOrganisationBillable } from "~/cloud/helpers";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { useInstanceDeployMutation } from "~/cloud/mutations/deploy";
import { useCloudOrganizationInstancesQuery } from "~/cloud/queries/instances";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { ActionButton } from "~/components/ActionButton";
import { REGION_FLAGS, SANDBOX } from "~/constants";
import { useBoolean } from "~/hooks/boolean";
import { useAvailableInstanceVersions } from "~/hooks/cloud";
import { useConnection, useMinimumVersion } from "~/hooks/connection";
import { useConnectionNavigator } from "~/hooks/routing";
import { useDatabaseSchema } from "~/hooks/schema";
import { useStable } from "~/hooks/stable";
import { openBillingRequiredModal } from "~/modals/billing-required";
import { useAuthentication } from "~/providers/Auth";
import { useConfirmation } from "~/providers/Confirmation";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { useDatabaseStore } from "~/stores/database";
import { useDeployStore } from "~/stores/deploy";
import { CloudDeployConfig } from "~/types";
import { getConnectionById } from "~/util/connection";
import { useFeatureFlags } from "~/util/feature-flags";
import { showErrorNotification } from "~/util/helpers";
import { generateRandomName } from "~/util/random";
import { requestDatabaseExport, resetConnection } from "../connection/connection";

export function ConnectionToolbarActions() {
	const { updateConnection } = useConfigStore.getState();
	const [{ sandbox_deploy }] = useFeatureFlags();

	const navigateConnection = useConnectionNavigator();
	const { signIn, isAuthenticated } = useAuthentication();
	const connectionState = useDatabaseStore((s) => s.currentState);
	const isConnected = connectionState === "connected";
	const isDisconnected = connectionState === "disconnected";
	const isSyncingSchema = useDatabaseStore((s) => s.isSyncingSchema);

	const [id, namespace, database, authMode] = useConnection((c) => [
		c?.id,
		c?.lastNamespace,
		c?.lastDatabase,
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
	const allRegions = useCloudStore((s) => s.instanceRegions);

	const versions = useAvailableInstanceVersions();
	const deployMutation = useInstanceDeployMutation(organization ?? undefined);
	const instanceTypes = useInstanceTypeRegistry(organization ?? undefined);
	const freeCount = instances.filter((instance) => instance.type.price_hour === 0).length;
	const isBillable = isOrganisationBillable(organization ?? undefined);
	const allowFree = freeCount < (organization?.max_free_instances ?? 0);

	const type = allowFree
		? instanceTypes.get("free")
		: instanceTypes.get(INSTANCE_PLAN_SUGGESTIONS.start[0]);

	const regionSet = new Set(organization?.plan?.regions ?? []);
	const supportedRegions = allRegions.filter((region) => regionSet.has(region.slug));
	const regionList = supportedRegions.map((region) => ({
		value: region.slug,
		label: region.description,
	}));

	const schema = useDatabaseSchema();
	const noTables = schema.tables.length === 0;
	const noFunctions = schema.functions.length === 0;
	const noParams = schema.params.length === 0;
	const noUsers = schema.users.length === 0;
	const isSchemaEmpty = noTables && noFunctions && noParams && noUsers;

	// biome-ignore lint/correctness/useExhaustiveDependencies: Not necessary
	useEffect(() => {
		if (!organization && organizations.length > 0) {
			setOrganization(organizations[0]);
		}

		if (!region && supportedRegions.length > 0) {
			setRegion(supportedRegions[0] ?? null);
		}
	}, [organization, region, organizations, supportedRegions]);

	const resetSandbox = useConfirmation({
		title: "Reset sandbox environment",
		message:
			"This will clear all data and query responses. Your queries will not be affected. Are you sure you want to continue?",
		skippable: true,
		confirmText: "Reset",
		confirmProps: { variant: "gradient" },
		onConfirm: resetConnection,
	});

	const handleDeploy = useStable(async () => {
		openHandle.close();
		setIsDeploying(true);

		try {
			const blob = await requestDatabaseExport({
				accesses: true,
				analyzers: true,
				functions: true,
				params: true,
				users: true,
				records: true,
				sequences: true,
				tables: true,
				v3: false,
			});

			const result = await blob.text();

			if (!result) {
				showErrorNotification({
					title: "Failed to deploy to cloud",
					content: "The database export was empty",
				});
				setIsDeploying(false);
				return;
			}

			setData(result);

			const deployInstance = async () => {
				if (!isBillable && !allowFree) {
					showErrorNotification({
						title: "Deployment cancelled",
						content: "Billing information is required to deploy a paid instance.",
					});

					setDeployConnectionId(null);
					setIsDeploying(false);
					setData("");
					return;
				} else if (!organization || !region || !type) {
					showErrorNotification({
						title: "Deployment cancelled",
						content:
							"Organization, region, and type are required to deploy an instance.",
					});

					setIsDeploying(false);
					setDeployConnectionId(null);
					setData("");
					return;
				}

				try {
					const config: CloudDeployConfig = {
						name: generateRandomName(),
						version: versions[0],
						region: region?.slug ?? "",
						computeType: type.slug ?? "",
						computeUnits: 1,
						plan: allowFree ? "free" : "start",
						private_traffic: false,
						public_traffic: true,
						storageAmount: type.default_storage_size,
						storageType: "",
						storageUnits: 3,
						startingData: { type: "none" },
					};

					const sandbox = getConnectionById(SANDBOX);

					if (!sandbox) {
						showErrorNotification({
							title: "Deployment failed",
							content: "Sandbox connection not found",
						});

						setIsDeploying(false);
						return;
					}

					const [_, conn] = await deployMutation.mutateAsync(config);

					updateConnection({
						id: conn.id,
						activeQuery: sandbox.activeQuery,
						queries: sandbox.queries,
					});

					setDeployConnectionId(conn.id);
					setIsDeploying(false);
					setOrganization(null);
					setRegion(null);
					navigateConnection(conn.id, "dashboard");
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
							setDeployConnectionId(null);
							setData("");

							showErrorNotification({
								title: "Deployment failed",
								content: "Payment information is required",
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
			setIsDeploying(false);
			showErrorNotification({
				title: "Deployment failed",
				content: error,
			});
		}
	});

	const [isSupported, version] = useMinimumVersion(import.meta.env.SDB_VERSION);
	const isSandbox = id === SANDBOX;

	return (
		<>
			{!isAuthenticated && authMode === "cloud" && (
				<Button
					variant="gradient"
					size="xs"
					onClick={() => signIn()}
				>
					Sign in to connect
				</Button>
			)}

			{isConnected && isSandbox && (
				<ActionButton
					size="md"
					color="obsidian"
					label="Reset sandbox environment"
					onClick={resetSandbox}
				>
					<Icon path={iconReset} />
				</ActionButton>
			)}

			{isConnected && isSchemaEmpty && namespace && database && !isSyncingSchema && id && (
				<Button
					size="xs"
					variant="light"
					onClick={() => navigateConnection(id, "settings/data")}
					leftSection={<Icon path={iconTable} />}
				>
					Import sample data
				</Button>
			)}

			{isDisconnected && (
				<Badge
					variant="light"
					color="red"
					px="sm"
					h={28}
					leftSection={
						<Icon
							path={iconCircleFilled}
							c="red"
						/>
					}
				>
					Disconnected
				</Badge>
			)}

			{isConnected && isSandbox && sandbox_deploy && isAuthenticated && (
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
							variant="light"
							color="violet"
							size="xs"
							pr={4}
							loading={isDeploying}
							rightSection={
								<ThemeIcon
									variant="gradient"
									size="xs"
									ml="xs"
								>
									<Icon path={iconCursor} />
								</ThemeIcon>
							}
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
												? (organizations.find((org) => org.id === value) ??
														null)
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
									color="obsidian"
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
									onClick={handleDeploy}
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
					onClick={() => signIn()}
				>
					Deploy to Cloud
				</Button>
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
		</>
	);
}
