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
import {
	Icon,
	iconArrowUpRight,
	iconChevronRight,
	iconCreditCard,
	iconDatabase,
	iconHistory,
	iconMarker,
	iconMemory,
	iconPackageClosed,
	iconQuery,
	iconRelation,
	iconTag,
	iconWarning,
	pictoSDBCloudGradient,
} from "@surrealdb/ui";
import { ChangeEvent, useState } from "react";
import { navigate } from "wouter/use-browser-location";
import glow from "~/assets/images/glow.png";
import { ApiError } from "~/cloud/api";
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
import { Label } from "~/components/Label";
import { LearnMore } from "~/components/LearnMore";
import { PaymentDetails } from "~/components/PaymentDetails";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { PropertyValue } from "~/components/PropertyValue";
import { Spacer } from "~/components/Spacer";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { getTypeCategoryName } from "~/util/cloud";
import {
	appendQueriesToConnection,
	loadDatasetSampleQueries,
	resolveDefaultDeployDatasetPath,
} from "~/util/datasets";
import { formatMemory, plural, showErrorNotification } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import { APPLY_DATA_FILE_KEY, APPLY_DATASET_KEY } from "~/util/storage";
import { STARTING_DATA } from "../constants";
import classes from "../style.module.scss";
import { StepProps } from "../types";

export function CheckoutStep({ organisation, details, setDetails, setStep }: StepProps) {
	const navigateConnection = useConnectionNavigator();
	const isScale = details.plan === "scale";
	const deployMutation = useInstanceDeployMutation(organisation);
	const computeTypes = useInstanceTypeRegistry(organisation, "compute");
	// const storageTypes = useInstanceTypeRegistry(organisation, "storage");
	const instanceType = computeTypes.get(details.computeType);
	// const storageType = storageTypes.get(details.storageType);
	const [limitReached, setLimitReached] = useState(false);

	const handleDeploy = useStable(async () => {
		setLimitReached(false);

		try {
			const [instance, connection] = await deployMutation.mutateAsync(details);

			if (details.startingData.type === "dataset") {
				const datasetPath = await resolveDefaultDeployDatasetPath(details.version);

				if (datasetPath) {
					sessionStorage.setItem(`${APPLY_DATASET_KEY}:${instance.id}`, datasetPath);
				}

				const queries = await loadDatasetSampleQueries(
					"surreal-deal-store",
					details.version,
				);

				if (queries.length > 0) {
					appendQueriesToConnection(
						queries,
						queries.map((query) => query.name),
					);
				}
			} else if (details.startingData.type === "upload") {
				sessionStorage.setItem(`${APPLY_DATA_FILE_KEY}:${instance.id}`, "true");
			}

			navigateConnection(connection.id, "dashboard");
		} catch (err: any) {
			if (err instanceof ApiError && err.status === 412) {
				setLimitReached(true);
				return;
			}

			showErrorNotification({
				title: "Failed to deploy instance",
				content: err.message,
			});
		}
	});

	const isFree = instanceType?.category === "free";
	const isManaged = isBillingManaged(organisation);
	const isBillable = isOrganisationBillable(organisation);
	const isBlocked = !isFree && !isBillable;

	const regions = useCloudStore((s) => s.instanceRegions);
	const regionName =
		regions.find((r) => r.slug === details?.region)?.description ?? details?.region;

	const memoryMax = instanceType?.memory ?? 0;
	const computeCores = instanceType?.cpu ?? 0;
	const computeMax = instanceType?.compute_units.max ?? 0;
	const computeTypeName = instanceType?.display_name ?? "";
	const computeTypeCategory = instanceType?.category ?? "";
	// const storageTypeName = storageType?.display_name ?? "";
	// const storageTypeCategory = storageType?.category ?? "";

	const backupText = isFree ? "Upgrade required" : "Available";
	const computeTypeText = isFree
		? "Free"
		: `${computeTypeName} (${getTypeCategoryName(computeTypeCategory)})`;
	// const _storageTypeText = `${storageTypeName} (${getTypeCategoryName(storageTypeCategory)})`;
	const computeText = isScale
		? `${computeCores} ${plural(computeCores, "vCPU", "vCPUs")}`
		: `${computeMax} vCPU${plural(computeMax, "", "s")} (${computeCores} ${plural(computeCores, "Core", "Cores")})`;
	const computeNodesText = isScale ? `${details.computeUnits} Nodes` : "Single-node";
	// const _storageNodesText = `${formatMemory(details.storageAmount * 1000, true)} x ${details.storageUnits} Nodes`;
	const storageText = formatMemory(details.storageAmount * 1000, true);
	const startingDataText = STARTING_DATA[details.startingData.type].title;

	const handleContactSales = useStable(() => {
		dispatchIntent("create-message", {
			type: "conversation",
			organisation: organisation.id,
			conversationType: "sales-enquiry",
			subject: "Instance limit enquiry",
			message: `Hello! I would like to discuss increasing organisation instance limits for my organisation (ID: ${organisation.id}). Thanks!`,
		});
	});

	const updateMigration = useStable((e: ChangeEvent<HTMLInputElement>) => {
		setDetails((draft) => {
			draft.migration = e.target.checked;
		});
	});

	return (
		<>
			<Paper
				className={classes.confirmBox}
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
						<Text
							mt="xs"
							fz="sm"
							className="selectable"
						>
							Please confirm whether the presented details are correct.
						</Text>
						<Button
							mt="xl"
							size="xs"
							color="obsidian"
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
					{isScale ? (
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
								title="Storage"
								icon={iconDatabase}
								value={storageText}
							/>

							<PropertyValue
								title="Starting data"
								icon={iconDatabase}
								value={startingDataText}
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
				<Text className="selectable">{organisation.name}</Text>
			</Box>

			{isFree ? (
				<Paper
					className={classes.freeBox}
					mt="md"
					p="xl"
				>
					<Stack
						gap={0}
						className="selectable"
					>
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
						src={pictoSDBCloudGradient}
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
						<Text className="selectable">{getBillingProviderAction(organisation)}</Text>
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
					mt="md"
					p={4}
					pr="xl"
				>
					<Flex
						wrap="nowrap"
						direction={{ base: "column", sm: "row" }}
						align={{ base: "start", sm: "center" }}
					>
						<Group
							w="100%"
							p="md"
							gap="lg"
							align="start"
						>
							<Icon path={iconCreditCard} />
							<Stack gap="xs">
								<Text
									fw={600}
									c="bright"
								>
									Billing & payment information available
								</Text>
								<Text
									fz="xs"
									className="selectable"
								>
									Your billing and payment information is already set up for this
									organisation.
								</Text>
							</Stack>
							<Spacer />
							{!isManaged && (
								<Button
									mt="md"
									size="xs"
									color="obsidian"
									variant="light"
									rightSection={
										<Icon
											size="sm"
											path={iconArrowUpRight}
										/>
									}
									onClick={() => navigate(`/o/${organisation.id}/billing`)}
								>
									Update billing details
								</Button>
							)}
						</Group>
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
				<LearnMore href="https://surrealdb.com/docs/build/migrating/from-old-surrealdb-versions/2x-to-3x">
					Learn more about the migration process
				</LearnMore>
			</Box>

			<Divider my={36} />

			{limitReached && (
				<Alert
					mb="xl"
					color="red"
					icon={<Icon path={iconWarning} />}
					title="Instance limit reached"
				>
					<Text className="selectable">
						You have reached the maximum number of instances for this organisation.
					</Text>
					<Text className="selectable">
						Remove an existing instance or contact support to increase your limit before
						deploying a new instance.
					</Text>
					<Button
						mt="md"
						size="xs"
						variant="gradient"
						rightSection={<Icon path={iconChevronRight} />}
						onClick={handleContactSales}
					>
						Contact us
					</Button>
				</Alert>
			)}

			<Group>
				<Button
					color="obsidian"
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
				<EstimatedCost
					ta="right"
					organisation={organisation}
					config={details}
				/>
			</Group>
		</>
	);
}
