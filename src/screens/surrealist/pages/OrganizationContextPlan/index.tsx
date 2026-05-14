import {
	Alert,
	Box,
	Button,
	Group,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { HoverGlow, Icon, iconArrowUpRight, Spacer } from "@surrealdb/ui";
import { useState } from "react";
import { Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import { hasOrganizationRoles, ORG_ROLES_OWNER } from "~/cloud/helpers";
import {
	useContextPackagesQuery,
	useOrganizationContextPackageQuery,
} from "~/cloud/queries/contexts";
import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { CloudGuard } from "~/components/CloudGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useAbsoluteLocation, useSearchParams } from "~/hooks/routing";
import { ContextPlanCard } from "~/screens/surrealist/components/ContextPlanCard";
import type { CloudOrganization, PlanPeriod } from "~/types";
import { orgSectionBreadcrumbs } from "~/util/breadcrumbs";
import { PageContainer } from "../../components/PageContainer";
import classes from "./style.module.scss";

export interface OrganizationContextPlanPageProps {
	id: string;
}

export function OrganizationContextPlanPage({ id }: OrganizationContextPlanPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const { data: organisation } = useCloudOrganizationQuery(id);

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/overview" />;
	}

	return (
		<CloudGuard loading={organisationsQuery.isLoading}>
			<PageContent organisation={organisation as CloudOrganization} />
		</CloudGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
}

function PageContent({ organisation }: PageContentProps) {
	const params = useSearchParams();
	const redirect = params.redirect;
	const [, setLocation] = useAbsoluteLocation();

	const isOrgOwner = hasOrganizationRoles(organisation, ORG_ROLES_OWNER, true);

	const [billingPeriod, _] = useState<PlanPeriod>("monthly");

	const { data: availablePackages, isPending: packagesPending } = useContextPackagesQuery();
	const { data: orgPackages, isSuccess: orgPackageLoaded } = useOrganizationContextPackageQuery(
		organisation.id,
	);

	const activeOrgPackage = orgPackages?.find((p) => !p.disabled_at);
	const activePackageId = orgPackageLoaded ? activeOrgPackage?.package_id : undefined;

	const handleSelect = (packageId: string) => {
		if (!isOrgOwner || packageId === activePackageId) return;

		const checkoutPath = `/o/${organisation.id}/contexts/checkout?package=${packageId}`;
		const fullPath = redirect
			? `${checkoutPath}&redirect=${encodeURIComponent(redirect)}`
			: checkoutPath;

		navigate(fullPath);
	};

	const displayedPackages = (availablePackages ?? []).filter(
		(p) => p.billing_period === billingPeriod,
	);

	return (
		<>
			<PageBreadcrumbs
				items={orgSectionBreadcrumbs(organisation, "contexts", { label: "Select plan" })}
			/>
			<CloudAdminGuard organisation={organisation}>
				<PageContainer>
					<Box my="xl">
						{!isOrgOwner && (
							<Alert
								mb="xl"
								color="orange"
								title="Owner access required"
							>
								<Text className="selectable">
									Only the organisation owner can subscribe to a Spectron plan and
									open checkout. Contact your organisation owner if you need a
									plan for this organisation.
								</Text>
							</Alert>
						)}
						<Stack
							align="center"
							gap={0}
						>
							<PrimaryTitle
								mt="sm"
								fz={32}
							>
								Plans and pricing
							</PrimaryTitle>
							<Text
								fz="lg"
								className="selectable"
							>
								Choose the Spectron plan that's right for you
							</Text>
							{/* Removed for now since we will only be offering monthly at launch */}

							{/* <SegmentedControl
								mt="xl"
								size="md"
								value={billingPeriod}
								onChange={(value) => setBillingPeriod(value as PlanPeriod)}
								data={[
									{ label: "Monthly", value: "monthly" },
									{ label: "Yearly", value: "yearly" },
								]}
							/> */}
						</Stack>
						{packagesPending ? (
							<SimpleGrid
								mt="xl"
								cols={{ base: 1, sm: 2, lg: 3 }}
								spacing="xl"
								className={classes.content}
							>
								<Skeleton h={300} />
								<Skeleton h={300} />
								<Skeleton h={300} />
							</SimpleGrid>
						) : (
							<SimpleGrid
								mt="xl"
								cols={{ base: 1, sm: 2, lg: 3 }}
								spacing="xl"
								className={classes.content}
							>
								{displayedPackages.map((pkg) => {
									const isCurrent = pkg.id === activePackageId;
									const isDisabled = isCurrent || !isOrgOwner;

									return (
										<UnstyledButton
											key={pkg.id}
											disabled={isDisabled}
											onClick={() => handleSelect(pkg.id)}
											renderRoot={
												isDisabled
													? undefined
													: (props) => <HoverGlow {...props} />
											}
										>
											<ContextPlanCard
												pkg={pkg}
												footer={
													<Button
														mt="md"
														size="lg"
														disabled={isDisabled}
													>
														{isCurrent ? "Current plan" : "Choose plan"}
													</Button>
												}
											/>
										</UnstyledButton>
									);
								})}
							</SimpleGrid>
						)}
					</Box>

					<Group justify="center">
						<Box flex={1}>
							<Button
								color="obsidian"
								variant="light"
								onClick={() => setLocation(`/o/${organisation.id}/billing`)}
							>
								Back
							</Button>
						</Box>
						<Stack
							align="center"
							mt={36}
						>
							<Text className="selectable">
								Looking for more pricing options and information?
							</Text>
							<a
								href="https://surrealdb.com/pricing?product=spectron"
								target="_blank"
								rel="noreferrer"
							>
								<Button
									size="xs"
									color="obsidian"
									variant="light"
									rightSection={<Icon path={iconArrowUpRight} />}
								>
									View pricing information
								</Button>
							</a>
						</Stack>
						<Spacer />
					</Group>
				</PageContainer>
			</CloudAdminGuard>
		</>
	);
}
