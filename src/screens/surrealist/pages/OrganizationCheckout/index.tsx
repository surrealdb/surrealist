import glow from "~/assets/images/glow.webp";
import cloud from "~/assets/images/icons/cloud.webp";
import classes from "./style.module.scss";

import {
	Alert,
	Box,
	Button,
	Divider,
	Flex,
	Group,
	Image,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";

import {
	iconArrowUpRight,
	iconCreditCard,
	iconDatabase,
	iconHistory,
	iconMarker,
	iconMemory,
	iconPackageClosed,
	iconQuery,
	iconRelation,
	iconTag,
} from "~/util/icons";

import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { useInstanceDeployMutation } from "~/cloud/mutations/deploy";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { AuthGuard } from "~/components/AuthGuard";
import { BillingDetails } from "~/components/BillingDetails";
import { CloudSplash } from "~/components/CloudSplash";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PaymentDetails } from "~/components/PaymentDetails";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { PropertyValue } from "~/components/PropertyValue";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useIsAuthenticated } from "~/hooks/cloud";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { CloudDeployConfig, CloudInstanceType, CloudOrganization } from "~/types";
import { getTypeCategoryName } from "~/util/cloud";
import { DatasetQuery, QUERY_ONE } from "~/util/dataset";
import { createBaseQuery } from "~/util/defaults";
import { formatMemory, plural, showErrorNotification } from "~/util/helpers";
import { APPLY_DATASET_KEY, DEPLOY_CONFIG_KEY } from "~/util/storage";

const SAMPLE_QUERIES: DatasetQuery[] = [QUERY_ONE];

export interface OrganizationCheckoutPageProps {
	id: string;
}

export function OrganizationCheckoutPage({ id }: OrganizationCheckoutPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const organisation = organisationsQuery.data?.find((org) => org.id === id);

	const [config] = useState(() => {
		const cached = localStorage.getItem(`${DEPLOY_CONFIG_KEY}:${id}`);

		if (cached) {
			try {
				return JSON.parse(cached) as CloudDeployConfig;
			} catch {
				return undefined;
			}
		}
	});

	const instanceTypes = useInstanceTypeRegistry(organisation);
	const instanceType = instanceTypes.get(config?.type ?? "");

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/organisations" />;
	}

	if (!config || typeof config !== "object" || !instanceType) {
		return <Redirect to="deploy" />;
	}

	return (
		<AuthGuard loading={organisationsQuery.isLoading}>
			<PageContent
				organisation={organisation as CloudOrganization}
				instanceType={instanceType}
				config={config}
			/>
		</AuthGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
	instanceType: CloudInstanceType;
	config: CloudDeployConfig;
}

function PageContent({ organisation, instanceType, config }: PageContentProps) {
	const isAuthed = useIsAuthenticated();
	const navigateConnection = useConnectionNavigator();
	const [, navigate] = useLocation();

	const deployMutation = useInstanceDeployMutation(organisation, config);

	const handleBack = useStable(() => {
		navigate("deploy");
	});

	const handleDeploy = useStable(async () => {
		try {
			const { settings, updateConnection } = useConfigStore.getState();
			const [instance, connection] = await deployMutation.mutateAsync();

			if (config.dataset) {
				sessionStorage.setItem(`${APPLY_DATASET_KEY}:${instance.id}`, "surreal-deal-store");

				const queries = SAMPLE_QUERIES.map((query) => ({
					...createBaseQuery(settings, "config"),
					name: query.name,
					query: query.query,
				}));

				updateConnection({
					id: connection.id,
					activeQuery: queries[0].id,
					queries,
				});
			}

			navigateConnection(connection.id, "dashboard");
			localStorage.removeItem(`${DEPLOY_CONFIG_KEY}:${organisation.id}`);
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to deploy instance",
				content: err.message,
			});
		}
	});

	const requireBilling = instanceType?.category !== "free";
	const hasBilling = !!organisation?.billing_info && !!organisation?.payment_info;
	const deployDisabled = !organisation || !config || (requireBilling && !hasBilling);

	const regions = useCloudStore((s) => s.regions);
	const regionName =
		regions.find((r) => r.slug === config?.region)?.description ?? config?.region;

	const memoryMax = instanceType?.memory ?? 0;
	const computeCores = instanceType?.cpu ?? 0;
	const computeMax = instanceType?.compute_units.max ?? 0;
	const typeName = instanceType?.display_name ?? "";
	const typeCategory = instanceType?.category ?? "";
	const nodeCount = config?.units ?? 0;

	const isFree = instanceType?.category === "free";
	const backupText = isFree ? "Upgrade required" : "Available";
	const typeText = isFree ? "Free" : `${typeName} (${getTypeCategoryName(typeCategory)})`;
	const computeText = `${computeMax} vCPU${plural(computeMax, "", "s")} (${computeCores} ${plural(computeCores, "Core", "Cores")})`;
	const nodeText = nodeCount === 1 ? "Single node" : `${nodeCount} Node`;
	const datasetText = config?.dataset ? "Yes" : "No";

	return (
		<AuthGuard>
			{isAuthed ? (
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
							mt={90}
						>
							{organisation && (
								<>
									<Box>
										<PageBreadcrumbs
											items={[
												{ label: "Surrealist", href: "/overview" },
												{ label: "Organisations", href: "/organisations" },
												{
													label: organisation.name,
													href: `/o/${organisation.id}`,
												},
												{ label: "Checkout" },
											]}
										/>
										<PrimaryTitle
											mt="sm"
											fz={32}
										>
											Checkout
										</PrimaryTitle>
									</Box>

									<Box mt="xl">
										<Paper
											className={classes.confirmBox}
											variant="gradient"
											p="xl"
										>
											<Image
												src={glow}
												className={classes.confirmGlow}
											/>
											<Flex
												pos="relative"
												align="stretch"
												direction={{ base: "column", md: "row" }}
											>
												<Box flex={1}>
													<PrimaryTitle>We're nearly there!</PrimaryTitle>
													<Text mt="xs">
														Please confirm whether the presented details
														are correct.
													</Text>
													<Button
														mt="xl"
														size="xs"
														color="slate"
														variant="light"
														onClick={handleBack}
													>
														Change configuration
													</Button>
												</Box>
												<Divider
													my="xl"
													hiddenFrom="md"
												/>
												<Divider
													mx="xl"
													orientation="vertical"
													visibleFrom="md"
												/>
												<SimpleGrid
													cols={{ base: 1, sm: 2, xl: 3 }}
													spacing="xl"
													verticalSpacing="xs"
												>
													<PropertyValue
														title="Type"
														icon={iconPackageClosed}
														value={typeText}
													/>

													<PropertyValue
														title="Region"
														icon={iconMarker}
														value={regionName}
													/>

													<PropertyValue
														title="Version"
														icon={iconTag}
														value={`SurrealDB ${config?.version}`}
													/>
													<PropertyValue
														title="Backups"
														icon={iconHistory}
														value={
															<Text c={isFree ? "orange" : undefined}>
																{backupText}
															</Text>
														}
													/>
													<PropertyValue
														title="Memory"
														icon={iconMemory}
														value={formatMemory(memoryMax)}
													/>

													<PropertyValue
														title="Compute"
														icon={iconQuery}
														value={computeText}
													/>

													<PropertyValue
														title="Nodes"
														icon={iconRelation}
														value={nodeText}
													/>

													<PropertyValue
														title="Dataset"
														icon={iconDatabase}
														value={datasetText}
													/>
												</SimpleGrid>
											</Flex>
										</Paper>

										<Box mt={36}>
											<PrimaryTitle>
												Billing & payment information
											</PrimaryTitle>
											<Text>{organisation.name}</Text>
										</Box>

										{!requireBilling ? (
											<Paper
												className={classes.freeBox}
												variant="gradient"
												mt="md"
												p="xl"
											>
												<Stack gap={0}>
													<Text
														c="bright"
														fw={600}
														fz="xl"
													>
														No billing information required
													</Text>
													<Box
														mt="sm"
														maw={400}
													>
														Your free Surreal Cloud instance is ready to
														deploy. Upgrades are available at any time
														once you have deployed your instance.
													</Box>
												</Stack>
												<Image
													src={cloud}
													className={classes.cloudImage}
												/>
												<Image
													src={glow}
													className={classes.freeGlow}
												/>
											</Paper>
										) : hasBilling ? (
											<Paper
												variant="gradient"
												mt="md"
												p={4}
												pr="xl"
											>
												<Flex
													wrap="nowrap"
													direction={{ base: "column", sm: "row" }}
													align={{ base: "start", sm: "center" }}
												>
													<Alert
														flex={1}
														color="slate"
														variant="subtle"
														icon={<Icon path={iconCreditCard} />}
														title="Billing & payment information available"
													>
														<Text>
															Your billing and payment information is
															already set up for this organisation.
														</Text>
														<Button
															mt="md"
															size="xs"
															hiddenFrom="sm"
															color="slate"
															variant="light"
															rightSection={
																<Icon path={iconArrowUpRight} />
															}
															onClick={() =>
																navigate(
																	`/o/${organisation.id}/billing`,
																)
															}
														>
															Update billing details
														</Button>
													</Alert>
													<Button
														size="xs"
														visibleFrom="sm"
														color="slate"
														variant="light"
														rightSection={
															<Icon path={iconArrowUpRight} />
														}
														onClick={() =>
															navigate(
																`/o/${organisation.id}/billing`,
															)
														}
													>
														Update billing details
													</Button>
												</Flex>
											</Paper>
										) : (
											<Alert
												mt="md"
												color="orange"
												icon={<Icon path={iconCreditCard} />}
												title="Billing & payment information required"
											>
												You must provide billing and payment details to
												deploy this instance. This information will be
												remembered for future deployments in this
												organisation.
											</Alert>
										)}

										{requireBilling && !hasBilling && (
											<SimpleGrid
												mt="xl"
												spacing="xl"
												cols={{
													xs: 1,
													md: 2,
												}}
											>
												<BillingDetails organisation={organisation} />
												<PaymentDetails organisation={organisation} />
											</SimpleGrid>
										)}

										<Divider my={36} />

										<Group>
											<Button
												color="slate"
												variant="light"
												onClick={handleBack}
											>
												Back
											</Button>
											<Button
												type="submit"
												variant="gradient"
												disabled={deployDisabled}
												loading={deployMutation.isPending}
												onClick={handleDeploy}
											>
												Deploy instance
											</Button>
											<Spacer />
											<EstimatedCost
												ta="right"
												organisation={organisation}
												config={config}
											/>
										</Group>
									</Box>
								</>
							)}
						</Stack>
					</ScrollArea>
				</Box>
			) : (
				<CloudSplash />
			)}
		</AuthGuard>
	);
}
