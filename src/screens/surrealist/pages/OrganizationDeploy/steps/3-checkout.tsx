import {
	Alert,
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { ChangeEvent } from "react";
import { navigate } from "wouter/use-browser-location";
import glow from "~/assets/images/glow.webp";
import cloud from "~/assets/images/icons/cloud.webp";
import {
	getBillingProviderAction,
	isBillingManaged,
	isOrganisationBillable,
} from "~/cloud/helpers";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { useInstanceDeployMutation } from "~/cloud/mutations/deploy";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { BillingDetails } from "~/components/BillingDetails";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { LearnMore } from "~/components/LearnMore";
import { PaymentDetails } from "~/components/PaymentDetails";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { PropertyValue } from "~/components/PropertyValue";
import { Spacer } from "~/components/Spacer";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { getTypeCategoryName } from "~/util/cloud";
import { SAMPLE_QUERIES } from "~/util/dataset";
import { createBaseQuery } from "~/util/defaults";
import { formatMemory, plural, showErrorNotification } from "~/util/helpers";
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
import { APPLY_DATA_FILE_KEY, APPLY_DATASET_KEY } from "~/util/storage";
import { STARTING_DATA } from "../constants";
import classes from "../style.module.scss";
import { StepProps } from "../types";

export function CheckoutStep({ organisation, details, setDetails, setStep }: StepProps) {
	const navigateConnection = useConnectionNavigator();
	const isDedicated = details.plan === "enterprise";
	const deployMutation = useInstanceDeployMutation(organisation);
	const computeTypes = useInstanceTypeRegistry(organisation, "compute");
	const storageTypes = useInstanceTypeRegistry(organisation, "storage");
	const instanceType = computeTypes.get(details.computeType);
	const storageType = storageTypes.get(details.storageType);

	const handleDeploy = useStable(async () => {
		try {
			const { settings, updateConnection } = useConfigStore.getState();
			const [instance, connection] = await deployMutation.mutateAsync(details);

			if (details.startingData.type === "dataset") {
				sessionStorage.setItem(
					`${APPLY_DATASET_KEY}:${instance.id}`,
					"surreal-deal-store-mini",
				);

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
			} else if (details.startingData.type === "upload") {
				sessionStorage.setItem(`${APPLY_DATA_FILE_KEY}:${instance.id}`, "true");
			}

			navigateConnection(connection.id, "dashboard");
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to deploy instance",
				content: err.message,
			});
		}
	});

	const isFree = instanceType?.category === "free";
	const isDistributed = details.plan === "enterprise";
	const isManaged = isBillingManaged(organisation);
	const isBillable = isOrganisationBillable(organisation);
	const isBlocked = !isFree && !isBillable;

	const regions = useCloudStore((s) => s.regions);
	const regionName =
		regions.find((r) => r.slug === details?.region)?.description ?? details?.region;

	const memoryMax = instanceType?.memory ?? 0;
	const computeCores = instanceType?.cpu ?? 0;
	const computeMax = instanceType?.compute_units.max ?? 0;
	const computeTypeName = instanceType?.display_name ?? "";
	const computeTypeCategory = instanceType?.category ?? "";
	const storageTypeName = storageType?.display_name ?? "";
	const storageTypeCategory = storageType?.category ?? "";

	const backupText = isFree ? "Upgrade required" : "Available";
	const computeTypeText = isFree
		? "Free"
		: `${computeTypeName} (${getTypeCategoryName(computeTypeCategory)})`;
	const storageTypeText = `${storageTypeName} (${getTypeCategoryName(storageTypeCategory)})`;
	const computeText = `${computeMax} vCPU${plural(computeMax, "", "s")} (${computeCores} ${plural(computeCores, "Core", "Cores")})`;
	const computeNodesText = isDedicated ? details.computeUnits : "Single-node";
	const storageNodesText = `${formatMemory(details.storageAmount * 1000, true)} x ${details.storageUnits} Nodes`;
	const startingDataText = STARTING_DATA[details.startingData.type].title;

	const updateMigration = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setDetails((draft) => {
			draft.migration = e.target.checked;
		});
	});

	return (
		<>
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
					<Box
						flex={1}
						miw={250}
					>
						<PrimaryTitle>We're nearly there!</PrimaryTitle>
						<Text mt="xs">
							Please confirm whether the presented details are correct.
						</Text>
						<Button
							mt="xl"
							size="xs"
							color="slate"
							variant="light"
							onClick={() => setStep(1)}
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
					{isDistributed ? (
						<SimpleGrid
							cols={{ base: 1, sm: 2 }}
							spacing="xl"
							verticalSpacing="xs"
						>
							<PropertyValue
								title="Compute Type"
								icon={iconQuery}
								value={computeTypeText}
							/>

							<PropertyValue
								title="Storage Type"
								icon={iconQuery}
								value={storageTypeText}
							/>

							<PropertyValue
								title="Compute Nodes"
								icon={iconMemory}
								value={computeNodesText}
							/>

							<PropertyValue
								title="Storage Nodes"
								icon={iconMemory}
								value={storageNodesText}
							/>

							<PropertyValue
								title="Region"
								icon={iconMarker}
								value={regionName}
							/>

							<PropertyValue
								title="Version"
								icon={iconTag}
								value={`SurrealDB ${details?.version}`}
							/>
						</SimpleGrid>
					) : (
						<SimpleGrid
							cols={{ base: 1, sm: 2, xl: 3 }}
							spacing="xl"
							verticalSpacing="xs"
						>
							<PropertyValue
								title="Type"
								icon={iconPackageClosed}
								value={computeTypeText}
							/>

							<PropertyValue
								title="Region"
								icon={iconMarker}
								value={regionName}
							/>

							<PropertyValue
								title="Version"
								icon={iconTag}
								value={`SurrealDB ${details?.version}`}
							/>
							<PropertyValue
								title="Backups"
								icon={iconHistory}
								value={<Text c={isFree ? "orange" : undefined}>{backupText}</Text>}
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
								value={computeNodesText}
							/>

							<PropertyValue
								title="Starting data"
								icon={iconDatabase}
								value={startingDataText}
							/>
						</SimpleGrid>
					)}
				</Flex>
			</Paper>

			<Box mt={36}>
				<PrimaryTitle>Billing & payment information</PrimaryTitle>
				<Text>{organisation.name}</Text>
			</Box>

			{isFree ? (
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
							Your free SurrealDB Cloud instance is ready to deploy. Upgrades are
							available at any time once you have deployed your instance.
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
			) : isBlocked ? (
				<>
					<Alert
						mt="md"
						color="orange"
						icon={<Icon path={iconCreditCard} />}
						title="Billing & payment information required"
					>
						{getBillingProviderAction(organisation)}
					</Alert>
					{!isManaged && (
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
				</>
			) : (
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
								Your billing and payment information is already set up for this
								organisation.
							</Text>
							{!isManaged && (
								<Button
									mt="md"
									size="xs"
									hiddenFrom="sm"
									color="slate"
									variant="light"
									rightSection={<Icon path={iconArrowUpRight} />}
									onClick={() => navigate(`/o/${organisation.id}/billing`)}
								>
									Update billing details
								</Button>
							)}
						</Alert>
						{!isManaged && (
							<Button
								size="xs"
								visibleFrom="sm"
								color="slate"
								variant="light"
								rightSection={<Icon path={iconArrowUpRight} />}
								onClick={() => navigate(`/o/${organisation.id}/billing`)}
							>
								Update billing details
							</Button>
						)}
					</Flex>
				</Paper>
			)}

			<Box mt={36}>
				<PrimaryTitle>Additional information</PrimaryTitle>
			</Box>

			<Checkbox
				mt="md"
				label={<Label>This instance is used to migrate to SurrealDB 3.0</Label>}
				description="Instances used to migrate to SurrealDB 3.0 may be eligible for compensation"
				checked={details.migration ?? false}
				onChange={updateMigration}
			/>

			<Box mt="xl">
				<LearnMore href="https://surrealdb.com/docs/surrealdb/installation/upgrading/migrating-data-to-3x">
					Learn more about the migration process
				</LearnMore>
			</Box>

			<Divider my={36} />

			<Group>
				<Button
					color="slate"
					variant="light"
					onClick={() => setStep(1)}
				>
					Back
				</Button>
				<Button
					type="submit"
					variant="gradient"
					disabled={isBlocked}
					loading={deployMutation.isPending}
					onClick={() => {
						if (organisation.resources_locked) {
							openResourcesLockedModal(organisation);
						} else {
							handleDeploy();
						}
					}}
				>
					Deploy instance
				</Button>
				<Spacer />
				{!isDedicated && (
					<EstimatedCost
						ta="right"
						organisation={organisation}
						config={details}
					/>
				)}
			</Group>
		</>
	);
}
