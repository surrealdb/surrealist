import {
	Alert,
	Box,
	Button,
	Divider,
	Flex,
	Group,
	Image,
	Paper,
	SimpleGrid,
	Stack,
	Text,
} from "@mantine/core";
import { navigate } from "wouter/use-browser-location";
import glow from "~/assets/images/glow.webp";
import cloud from "~/assets/images/icons/cloud.webp";
import { useInstanceTypeRegistry } from "~/cloud/hooks/types";
import { useInstanceDeployMutation } from "~/cloud/mutations/deploy";
import { BillingDetails } from "~/components/BillingDetails";
import { EstimatedCost } from "~/components/EstimatedCost";
import { Icon } from "~/components/Icon";
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

export function CheckoutStep({ organisation, details, setStep }: StepProps) {
	const navigateConnection = useConnectionNavigator();
	const deployMutation = useInstanceDeployMutation(organisation, details);
	const instanceTypes = useInstanceTypeRegistry(organisation);
	const instanceType = instanceTypes.get(details.type);

	const handleDeploy = useStable(async () => {
		try {
			const { settings, updateConnection } = useConfigStore.getState();
			const [instance, connection] = await deployMutation.mutateAsync();

			if (details.startingData.type === "dataset") {
				const dataset =
					details.startingData.datasetOptions?.id ?? "surreal-deal-store-mini";
				const addQueries = details.startingData.datasetOptions?.addQueries;

				sessionStorage.setItem(`${APPLY_DATASET_KEY}:${instance.id}`, dataset);

				if (addQueries) {
					const queries = SAMPLE_QUERIES[dataset].map((query) => ({
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

	const requireBilling = instanceType?.category !== "free";
	const hasBilling = !!organisation?.billing_info && !!organisation?.payment_info;
	const deployDisabled = !organisation || (requireBilling && !hasBilling);

	const regions = useCloudStore((s) => s.regions);
	const regionName =
		regions.find((r) => r.slug === details?.region)?.description ?? details?.region;

	const memoryMax = instanceType?.memory ?? 0;
	const computeCores = instanceType?.cpu ?? 0;
	const computeMax = instanceType?.compute_units.max ?? 0;
	const typeName = instanceType?.display_name ?? "";
	const typeCategory = instanceType?.category ?? "";
	const nodeCount = details?.units ?? 0;

	const isFree = instanceType?.category === "free";
	const backupText = isFree ? "Upgrade required" : "Available";
	const typeText = isFree ? "Free" : `${typeName} (${getTypeCategoryName(typeCategory)})`;
	const computeText = `${computeMax} vCPU${plural(computeMax, "", "s")} (${computeCores} ${plural(computeCores, "Core", "Cores")})`;
	const nodeText = nodeCount === 1 ? "Single node" : plural(nodeCount, `${nodeCount} Node`);
	const startingDataText =
		STARTING_DATA.find((data) => data.id === details.startingData.type)?.title ?? "None";

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
					<Box flex={1}>
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
							value={nodeText}
						/>

						<PropertyValue
							title="Starting data"
							icon={iconDatabase}
							value={startingDataText}
						/>
					</SimpleGrid>
				</Flex>
			</Paper>

			<Box mt={36}>
				<PrimaryTitle>Billing & payment information</PrimaryTitle>
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
							Your free Surreal Cloud instance is ready to deploy. Upgrades are
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
								Your billing and payment information is already set up for this
								organisation.
							</Text>
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
						</Alert>
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
					</Flex>
				</Paper>
			) : (
				<Alert
					mt="md"
					color="orange"
					icon={<Icon path={iconCreditCard} />}
					title="Billing & payment information required"
				>
					You must provide billing and payment details to deploy this instance. This
					information will be remembered for future deployments in this organisation.
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
					onClick={() => setStep(1)}
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
					config={details}
				/>
			</Group>
		</>
	);
}
