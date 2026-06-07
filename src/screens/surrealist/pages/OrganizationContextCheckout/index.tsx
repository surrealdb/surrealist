import {
	Alert,
	Box,
	Button,
	Divider,
	Flex,
	Group,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconArrowUpRight, iconCreditCard } from "@surrealdb/ui";
import { useState } from "react";
import { Redirect } from "wouter";
import { navigate } from "wouter/use-browser-location";
import {
	getBillingProviderAction,
	hasOrganizationRoles,
	isBillingManaged,
	isOrganisationBillable,
	ORG_ROLES_OWNER,
} from "~/cloud/helpers";
import { useAssignContextPackageMutation } from "~/cloud/mutations/spectron";
import { useContextPackagesQuery } from "~/cloud/queries/contexts";
import {
	useCloudOrganizationQuery,
	useCloudOrganizationsQuery,
} from "~/cloud/queries/organizations";
import { BillingDetails } from "~/components/BillingDetails";
import { CloudAdminGuard } from "~/components/CloudAdminGuard";
import { CloudGuard } from "~/components/CloudGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PaymentDetails } from "~/components/PaymentDetails";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useSearchParams } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { ContextPlanCard } from "~/screens/surrealist/components/ContextPlanCard";
import type { CloudOrganization } from "~/types";
import { orgSectionBreadcrumbs } from "~/util/breadcrumbs";
import { showErrorNotification, showInfo } from "~/util/helpers";

export interface OrganizationContextCheckoutPageProps {
	id: string;
}

export function OrganizationContextCheckoutPage({ id }: OrganizationContextCheckoutPageProps) {
	const organisationsQuery = useCloudOrganizationsQuery();
	const { data: organisation } = useCloudOrganizationQuery(id);

	if (organisationsQuery.isSuccess && !organisation) {
		return <Redirect to="/" />;
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
	const packageId = params.package;
	const redirect = params.redirect;

	const { data: availablePackages } = useContextPackagesQuery();
	const assignMutation = useAssignContextPackageMutation(organisation.id);

	const [isConfirming, setIsConfirming] = useState(false);
	const [couponCode, setCouponCode] = useInputState("");

	const selectedPackage = availablePackages?.find((p) => p.id === packageId);

	const isManaged = isBillingManaged(organisation);
	const isBillable = isOrganisationBillable(organisation);
	const canConfirm = isBillable && !!selectedPackage;

	const handleConfirm = useStable(async () => {
		if (!canConfirm || isConfirming) return;

		setIsConfirming(true);

		try {
			await assignMutation.mutateAsync({
				packageId,
				coupon_code: couponCode.trim() || undefined,
			});

			showInfo({
				title: "Package updated",
				subtitle: "Your Spectron context package has been updated",
			});

			if (redirect) {
				navigate(redirect);
			} else {
				navigate(`/o/${organisation.id}/billing`);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : String(err);

			showErrorNotification({
				title: "Failed to assign package",
				content: message,
			});
		} finally {
			setIsConfirming(false);
		}
	});

	if (!packageId) {
		return <Redirect to={`/o/${organisation.id}/contexts/plan`} />;
	}

	const isOrgOwner = hasOrganizationRoles(organisation, ORG_ROLES_OWNER, true);

	if (!isOrgOwner) {
		const planPath = redirect
			? `/o/${organisation.id}/contexts/plan?redirect=${encodeURIComponent(redirect)}`
			: `/o/${organisation.id}/contexts/plan`;
		return <Redirect to={planPath} />;
	}

	return (
		<>
			<PageBreadcrumbs
				items={orgSectionBreadcrumbs(
					organisation,
					"contexts",
					{ label: "Select plan", href: `/o/${organisation.id}/contexts/plan` },
					{ label: "Checkout" },
				)}
			/>
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
								<PrimaryTitle
									mt="sm"
									fz={32}
								>
									Checkout
								</PrimaryTitle>
							</Box>

							<Box my="xl">
								<Flex
									align="flex-start"
									direction={{ base: "column-reverse", md: "row" }}
									gap={{ base: "xl", md: "xl" }}
								>
									<Box
										flex={1}
										miw={0}
									>
										<Box>
											<PrimaryTitle>
												Billing & payment information
											</PrimaryTitle>
											<Text className="selectable">{organisation.name}</Text>
										</Box>

										{isManaged ? (
											<Alert
												mt="md"
												color="orange"
												icon={<Icon path={iconCreditCard} />}
												title="Billing provider not supported"
											>
												<Text
													fz="sm"
													className="selectable"
												>
													Spectron context packages are only available for
													organisations using Stripe billing.{" "}
													{getBillingProviderAction(organisation)}
												</Text>
												<Button
													mt="md"
													size="xs"
													variant="gradient"
													onClick={() => navigate("/o/create")}
												>
													Create new organisation
												</Button>
											</Alert>
										) : !isBillable ? (
											<>
												<Alert
													mt="md"
													color="orange"
													icon={<Icon path={iconCreditCard} />}
													title="Billing & payment information required"
												>
													<Text className="selectable">
														{getBillingProviderAction(organisation)}
													</Text>
												</Alert>
												<SimpleGrid
													mt="xl"
													spacing="xl"
													cols={{ xs: 1, md: 2 }}
												>
													<BillingDetails organisation={organisation} />
													<PaymentDetails organisation={organisation} />
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
														<Icon path={iconCreditCard} />
														<Stack gap="xs">
															<Text
																fw={600}
																c="bright"
															>
																Billing & payment information
																available
															</Text>
															<Text
																fz="xs"
																className="selectable"
															>
																Your billing and payment information
																is already set up for this
																organisation.
															</Text>
														</Stack>
														<Spacer />
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
															onClick={() =>
																navigate(
																	`/o/${organisation.id}/billing`,
																)
															}
														>
															Update billing details
														</Button>
													</Group>
												</Flex>
											</Paper>
										)}

										{!isManaged && !!selectedPackage && (
											<Box mt="xl">
												<TextInput
													label="Coupon code"
													placeholder="Promotional code"
													value={couponCode}
													onChange={setCouponCode}
													maw={420}
												/>
											</Box>
										)}

										<Divider my={36} />

										<Group>
											<Button
												color="obsidian"
												variant="light"
												onClick={() =>
													navigate(
														`/o/${organisation.id}/contexts/plan${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ""}`,
													)
												}
											>
												Back
											</Button>
											<Button
												variant="gradient"
												disabled={!canConfirm}
												loading={isConfirming}
												onClick={handleConfirm}
											>
												Confirm subscription
											</Button>
										</Group>
									</Box>

									<Box
										maw={420}
										miw={{ base: "100%", md: 320 }}
										w={{ base: "100%", md: "auto" }}
										style={{ flexShrink: 0 }}
									>
										{selectedPackage ? (
											<ContextPlanCard pkg={selectedPackage} />
										) : (
											<Text
												c="red"
												className="selectable"
											>
												Selected package not found. Please go back and
												select a valid package.
											</Text>
										)}
									</Box>
								</Flex>
							</Box>
						</Stack>
					</ScrollArea>
				</Box>
			</CloudAdminGuard>
		</>
	);
}
