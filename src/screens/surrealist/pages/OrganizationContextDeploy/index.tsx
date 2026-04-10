import {
	Alert,
	Anchor,
	Box,
	Button,
	Checkbox,
	Divider,
	Flex,
	Group,
	Image,
	Paper,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconCheck,
	iconChevronRight,
	iconCreditCard,
	iconMarker,
	iconSpectron,
	iconTag,
} from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import glow from "~/assets/images/glow.png";
import {
	getBillingProviderAction,
	isBillingManaged,
	isOrganisationBillable,
} from "~/cloud/helpers";
import {
	useAssignContextPackageMutation,
	useCreateContextMutation,
} from "~/cloud/mutations/spectron";
import {
	useContextPackagesQuery,
	useOrganizationContextPackageQuery,
} from "~/cloud/queries/contexts";
import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { AuthGuard } from "~/components/AuthGuard";
import { BillingDetails } from "~/components/BillingDetails";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { Label } from "~/components/Label";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PaymentDetails } from "~/components/PaymentDetails";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { PropertyValue } from "~/components/PropertyValue";
import { Spacer } from "~/components/Spacer";
import { REGION_FLAGS } from "~/constants";
import { useContextNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import type { CloudOrganization, ContextPackage } from "~/types";
import { ON_FOCUS_SELECT, showErrorNotification } from "~/util/helpers";

export interface OrganizationContextDeployPageProps {
	id: string;
}

export function OrganizationContextDeployPage({ id }: OrganizationContextDeployPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const { data: organisation } = useCloudOrganizationQuery(id);

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/overview" />;
	}

	return (
		<AuthGuard loading={organisationsQuery.isLoading}>
			<PageContent organisation={organisation as CloudOrganization} />
		</AuthGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
}

const STEP_TITLES = ["Configure your context", "Checkout"];

function PageContent({ organisation }: PageContentProps) {
	const navigateContext = useContextNavigator();
	const allRegions = useCloudStore((s) => s.regions);
	const createContextMutation = useCreateContextMutation(organisation.id);
	const assignPackageMutation = useAssignContextPackageMutation(organisation.id);

	const [step, setStep] = useState(0);
	const [name, setName] = useState("");
	const [region, setRegion] = useState<string | null>(null);
	const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
	const [isDeploying, setIsDeploying] = useState(false);

	const { data: availablePackages } = useContextPackagesQuery();
	const { data: orgPackages, isSuccess: orgPackageLoaded } = useOrganizationContextPackageQuery(
		organisation.id,
	);

	const activeOrgPackage = orgPackages?.find((p) => !p.disabled_at);
	const hasOrgPackage = orgPackageLoaded && !!activeOrgPackage;

	const activePackageDetails = availablePackages?.find(
		(p) => p.id === activeOrgPackage?.package_id,
	);

	const regionSet = new Set(organisation?.plan.regions ?? []);
	const supportedRegions = allRegions.filter((r) => regionSet.has(r.slug));

	const regionList = useMemo(
		() =>
			supportedRegions.map((r) => ({
				value: r.slug,
				label: r.description,
			})),
		[supportedRegions],
	);

	const canProceed = name.trim().length > 0 && name.length <= 30 && region;

	const isManaged = isBillingManaged(organisation);
	const isBillable = isOrganisationBillable(organisation);
	const needsPackage = !hasOrgPackage;
	const canDeploy = isBillable && (!needsPackage || selectedPackageId);

	const regionName = allRegions.find((r) => r.slug === region)?.description ?? region ?? "";

	const handleDeploy = useStable(async () => {
		if (!canDeploy || !region || isDeploying) return;

		setIsDeploying(true);

		try {
			if (needsPackage && selectedPackageId) {
				await assignPackageMutation.mutateAsync(selectedPackageId);
			}

			const result = await createContextMutation.mutateAsync({
				name: name.trim(),
				region,
			});

			navigateContext(result.id);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);

			showErrorNotification({
				title: "Failed to create context",
				content: message,
			});
		} finally {
			setIsDeploying(false);
		}
	});

	return (
		<CloudAdminGuard organisation={organisation}>
			<Box
				flex={1}
				pos="relative"
			>
				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					mt={18}
				>
					<Stack
						px="xl"
						mx="auto"
						maw={1200}
						pb={68}
					>
						<Box>
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{
										label: organisation.name,
										href: `/o/${organisation.id}`,
									},
									{
										label: "Contexts",
										href: `/o/${organisation.id}/contexts`,
									},
									{ label: "Create context" },
								]}
							/>
							<PrimaryTitle
								mt="sm"
								fz={32}
							>
								<Text
									span
									inherit
									c="obsidian"
									mr="sm"
								>
									{step + 1}.
								</Text>
								{STEP_TITLES[step]}
							</PrimaryTitle>
						</Box>

						<Box my="xl">
							{step === 0 && (
								<ConfigureStep
									name={name}
									region={region}
									regionList={regionList}
									onNameChange={setName}
									onRegionChange={setRegion}
									canProceed={!!canProceed}
									onNext={() => setStep(1)}
								/>
							)}

							{step === 1 && (
								<CheckoutStep
									organisation={organisation}
									name={name}
									region={region}
									regionName={regionName}
									isBillable={isBillable}
									isManaged={isManaged}
									needsPackage={needsPackage}
									activePackage={activePackageDetails ?? null}
									availablePackages={availablePackages ?? []}
									selectedPackageId={selectedPackageId}
									onSelectPackage={setSelectedPackageId}
									canDeploy={!!canDeploy}
									isDeploying={isDeploying}
									onBack={() => setStep(0)}
									onDeploy={() => {
										if (organisation.resources_locked) {
											openResourcesLockedModal(organisation);
										} else {
											handleDeploy();
										}
									}}
								/>
							)}
						</Box>
					</Stack>
				</ScrollArea>
			</Box>
		</CloudAdminGuard>
	);
}

interface ConfigureStepProps {
	name: string;
	region: string | null;
	regionList: { value: string; label: string }[];
	onNameChange: (name: string) => void;
	onRegionChange: (region: string | null) => void;
	canProceed: boolean;
	onNext: () => void;
}

function ConfigureStep({
	name,
	region,
	regionList,
	onNameChange,
	onRegionChange,
	canProceed,
	onNext,
}: ConfigureStepProps) {
	return (
		<>
			<SimpleGrid
				spacing={{ base: 36, xl: 64 }}
				cols={{ base: 1, xl: 2 }}
			>
				<Stack gap="lg">
					<PrimaryTitle>Context details</PrimaryTitle>

					<TextInput
						label="Name"
						placeholder="Context name"
						description="Choose carefully, as this name cannot be changed later"
						value={name}
						onChange={(e) => onNameChange(e.currentTarget.value)}
						onFocus={ON_FOCUS_SELECT}
						error={name.length > 30 ? "Context name cannot exceed 30 characters" : null}
					/>

					<Select
						label="Region"
						placeholder="Select a region"
						description="Select the region where your context will be deployed"
						data={regionList}
						value={region}
						onChange={onRegionChange}
						leftSection={
							region && (
								<Image
									src={REGION_FLAGS[region]}
									w={18}
								/>
							)
						}
						renderOption={(opt) => (
							<Group>
								<Image
									src={REGION_FLAGS[opt.option.value]}
									w={24}
								/>
								{opt.option.label}
								{opt.checked && (
									<Icon
										path={iconCheck}
										c="bright"
									/>
								)}
							</Group>
						)}
					/>
				</Stack>
			</SimpleGrid>

			<Group mt={36}>
				<Button
					variant="gradient"
					disabled={!canProceed}
					onClick={onNext}
					rightSection={<Icon path={iconChevronRight} />}
				>
					Continue to checkout
				</Button>
			</Group>
		</>
	);
}

interface CheckoutStepProps {
	organisation: CloudOrganization;
	name: string;
	region: string | null;
	regionName: string;
	isBillable: boolean;
	isManaged: boolean;
	needsPackage: boolean;
	activePackage: ContextPackage | null;
	availablePackages: ContextPackage[];
	selectedPackageId: string | null;
	onSelectPackage: (id: string | null) => void;
	canDeploy: boolean;
	isDeploying: boolean;
	onBack: () => void;
	onDeploy: () => void;
}

function CheckoutStep({
	organisation,
	name,
	regionName,
	isBillable,
	isManaged,
	needsPackage,
	activePackage,
	availablePackages,
	selectedPackageId,
	onSelectPackage,
	canDeploy,
	isDeploying,
	onBack,
	onDeploy,
}: CheckoutStepProps) {
	const isBlocked = !isBillable;

	return (
		<>
			<Paper
				p="xl"
				style={{ overflow: "hidden", position: "relative" }}
			>
				<Image
					src={glow}
					style={{
						width: 900,
						height: 900,
						position: "absolute",
						zIndex: 0,
						opacity: 0.25,
						left: -400,
						bottom: -550,
						transform: "rotate(45deg)",
					}}
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
						>
							Please confirm whether the presented details are correct.
						</Text>
						<Button
							mt="xl"
							size="xs"
							color="obsidian"
							variant="light"
							onClick={onBack}
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
						cols={{ base: 1, sm: 2 }}
						spacing="xl"
						verticalSpacing="xs"
					>
						<PropertyValue
							title="Name"
							icon={iconTag}
							value={name}
						/>
						<PropertyValue
							title="Region"
							icon={iconMarker}
							value={regionName}
						/>
					</SimpleGrid>
				</Flex>
			</Paper>

			<Box mt={36}>
				<PrimaryTitle>Context package</PrimaryTitle>
				<Text>{organisation.name}</Text>
			</Box>

			{needsPackage ? (
				<>
					<Text
						fz="sm"
						mt="md"
					>
						Select a context package to enable Spectron for this organisation. This
						package applies to all contexts within the organisation.
					</Text>
					<SimpleGrid
						mt="md"
						cols={{ base: 1, sm: 2, lg: 3 }}
						spacing="xl"
					>
						{availablePackages.map((pkg) => (
							<PackageCard
								key={pkg.id}
								pkg={pkg}
								isSelected={selectedPackageId === pkg.id}
								onSelect={() => onSelectPackage(pkg.id)}
							/>
						))}
					</SimpleGrid>
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
							<Icon path={iconSpectron} />
							<Stack gap="xs">
								<Text
									fw={600}
									c="bright"
								>
									Context package configured
								</Text>
								<Text fz="xs">
									This organisation is using the{" "}
									<Text
										span
										fw={600}
										c="bright"
									>
										{activePackage?.name}
									</Text>{" "}
									package. All contexts will use this package.
								</Text>
							</Stack>
						</Group>
					</Flex>
				</Paper>
			)}

			<Box mt={36}>
				<PrimaryTitle>Billing & payment information</PrimaryTitle>
				<Text>{organisation.name}</Text>
			</Box>

			{isBlocked ? (
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
							cols={{ xs: 1, md: 2 }}
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
								<Text fz="xs">
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

			<Divider my={36} />

			<Group>
				<Button
					color="obsidian"
					variant="light"
					onClick={onBack}
				>
					Back
				</Button>
				<Button
					type="submit"
					variant="gradient"
					disabled={!canDeploy}
					loading={isDeploying}
					onClick={onDeploy}
				>
					Create context
				</Button>
			</Group>
		</>
	);
}

interface PackageCardProps {
	pkg: ContextPackage;
	isSelected: boolean;
	onSelect: () => void;
}

function formatPackagePrice(millcents: number) {
	const dollars = millcents / 100_000;

	return `$${dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2)}`;
}

function PackageCard({ pkg, isSelected, onSelect }: PackageCardProps) {
	const features = [
		`${pkg.token_limit.toLocaleString()} tokens`,
		`Up to ${pkg.contexts_limit} context${pkg.contexts_limit !== 1 ? "s" : ""}`,
	];

	return (
		<Anchor
			h="100%"
			variant="glow"
			onClick={onSelect}
			style={{ cursor: "pointer" }}
		>
			<Paper
				h="100%"
				p="xl"
				style={{
					borderColor: isSelected ? "var(--mantine-color-surreal-6)" : undefined,
					borderWidth: isSelected ? 1 : undefined,
					borderStyle: isSelected ? "solid" : undefined,
				}}
			>
				<Stack h="100%">
					<Text
						c="obsidian.4"
						fw={600}
						lts="0.02em"
					>
						{pkg.name}
					</Text>
					<Group
						gap={8}
						align="center"
						wrap="nowrap"
					>
						<Title
							order={2}
							c="bright"
							fz={40}
							lh={1.1}
						>
							{formatPackagePrice(pkg.cost_millcents)}
						</Title>
						<Text
							c="obsidian.4"
							fz="xs"
							lh={1.1}
						>
							per
							<br />
							month
						</Text>
					</Group>
					<Text>{pkg.description}</Text>
					<Label mt="xl">What you get</Label>
					<Stack>
						{features.map((feat) => (
							<Group
								gap="sm"
								c="bright"
								key={feat}
							>
								<Checkbox
									readOnly
									checked
									size="sm"
									variant="gradient"
									styles={{
										icon: {
											width: 9,
										},
									}}
								/>
								{feat}
							</Group>
						))}
					</Stack>
					<Spacer />
					<Button
						size="lg"
						fullWidth
						variant={isSelected ? "gradient" : undefined}
						color={isSelected ? undefined : "obsidian"}
					>
						{isSelected ? "Selected" : "Select package"}
					</Button>
				</Stack>
			</Paper>
		</Anchor>
	);
}
