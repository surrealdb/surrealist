import {
	Alert,
	Box,
	Button,
	ScrollArea,
	SegmentedControl,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { HoverGlow, Icon, iconArrowUpRight } from "@surrealdb/ui";
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
import { AuthGuard } from "~/components/AuthGuard";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useSearchParams } from "~/hooks/routing";
import { ContextPlanCard } from "~/screens/surrealist/components/ContextPlanCard";
import type { CloudOrganization } from "~/types";
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
		<AuthGuard loading={organisationsQuery.isLoading}>
			<PageContent organisation={organisation as CloudOrganization} />
		</AuthGuard>
	);
}

interface PageContentProps {
	organisation: CloudOrganization;
}

function PageContent({ organisation }: PageContentProps) {
	const params = useSearchParams();
	const redirect = params.redirect;

	const isOrgOwner = hasOrganizationRoles(organisation, ORG_ROLES_OWNER, true);

	const [billingPeriod, setBillingPeriod] = useState<"month" | "year">("month");

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

	// When packages expose `billing_period`, filter with:
	// `(availablePackages ?? []).filter((p) => p.billing_period === billingPeriod)`
	const displayedPackages = availablePackages ?? [];

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
									...(isOrgOwner
										? [
												{
													label: "Billing",
													href: `/o/${organisation.id}/billing`,
												},
											]
										: []),
									{ label: "Select plan" },
								]}
							/>
						</Box>

						<Box my="xl">
							{!isOrgOwner && (
								<Alert
									mb="xl"
									color="orange"
									title="Owner access required"
								>
									Only the organisation owner can subscribe to a Spectron plan and
									open checkout. Contact your organisation owner if you need a
									plan for this organisation.
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
								<Text fz="lg">Choose the Spectron plan that's right for you</Text>
								<SegmentedControl
									mt="xl"
									size="md"
									value={billingPeriod}
									onChange={(value) =>
										setBillingPeriod(value as "month" | "year")
									}
									data={[
										{ label: "Monthly", value: "month" },
										{ label: "Yearly", value: "year" },
									]}
								/>
							</Stack>
							{packagesPending ? (
								<SimpleGrid
									mt="xl"
									cols={{ base: 1, sm: 2, lg: 3 }}
									spacing="xl"
									className={classes.content}
								>
									<Skeleton h={650} />
									<Skeleton h={650} />
									<Skeleton h={650} />
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
													isCurrent={pkg.id === activePackageId}
													footer={
														<Button
															mt="md"
															size="lg"
															disabled={isDisabled}
														>
															Choose plan
														</Button>
													}
												/>
											</UnstyledButton>
										);
									})}
								</SimpleGrid>
							)}
						</Box>

						<Stack
							align="center"
							mt={36}
						>
							<Text>Looking for more pricing options and information?</Text>
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
					</Stack>
				</ScrollArea>
			</Box>
		</CloudAdminGuard>
	);
}
