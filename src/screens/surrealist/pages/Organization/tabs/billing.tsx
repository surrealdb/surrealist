import {
	Alert,
	Anchor,
	Box,
	BoxProps,
	Button,
	Divider,
	Group,
	Image,
	List,
	Modal,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
	UnstyledButton,
} from "@mantine/core";
import { useDisclosure, useInputState } from "@mantine/hooks";
import {
	Icon,
	iconChevronRight,
	iconClose,
	iconCreditCard,
	iconDollar,
	iconOpen,
	iconUpload,
	pictoSpectronGradient,
} from "@surrealdb/ui";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import type { ReactNode } from "react";
import { Link } from "wouter";
import glow from "~/assets/images/radial-glow.png";
import { fetchAPI } from "~/cloud/api";
import { getBillingProviderAction, isBillingManaged } from "~/cloud/helpers";
import { useCancelContextPackageMutation } from "~/cloud/mutations/spectron";
import {
	useContextPackagesQuery,
	useOrganizationContextPackageQuery,
} from "~/cloud/queries/contexts";
import { useCloudCouponsQuery } from "~/cloud/queries/coupons";
import { BillingDetails } from "~/components/BillingDetails";
import { Form } from "~/components/Form";
import { PaymentDetails } from "~/components/PaymentDetails";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { Spacer } from "~/components/Spacer";
import { useHasCloudFeature } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { ContextPlanCard } from "~/screens/surrealist/components/ContextPlanCard";
import type { CloudCoupon, OrganizationContextPackage } from "~/types";
import { showErrorNotification, showInfo } from "~/util/helpers";
import classes from "../style.module.scss";
import type { OrganizationTabProps } from "../types";

export function OrganizationBillingTab({ organization }: OrganizationTabProps) {
	return (
		<Stack>
			<PrimaryTitle fz={32}>Billing</PrimaryTitle>
			{isBillingManaged(organization) ? (
				<ExternalBillingConfiguration organization={organization} />
			) : (
				<InternalBillingConfiguration organization={organization} />
			)}
		</Stack>
	);
}

function ExternalBillingConfiguration({ organization }: OrganizationTabProps) {
	return (
		<Section
			title="Organisation billing"
			description="Manage organisation payment and billing information"
		>
			<SimpleGrid
				cols={{
					xs: 1,
					md: 2,
				}}
				spacing="xl"
			>
				<Alert
					title="Billing managed externally"
					color="violet"
					mb="xl"
					icon={<Icon path={iconCreditCard} />}
				>
					<Text className="selectable">
						The billing for this organisation is managed externally.{" "}
						{getBillingProviderAction(organization)}
					</Text>
				</Alert>
			</SimpleGrid>
		</Section>
	);
}

function InternalBillingConfiguration({ organization }: OrganizationTabProps) {
	const client = useQueryClient();
	const showContexts = useHasCloudFeature("create_memory_store");
	const couponQuery = useCloudCouponsQuery(organization.id);
	const [coupon, setCoupon] = useInputState("");

	const redeemCoupon = useStable(async () => {
		try {
			await fetchAPI(`/organizations/${organization?.id}/coupon`, {
				method: "POST",
				body: JSON.stringify(coupon),
			});

			showInfo({
				title: "Discount code applied",
				subtitle: "The discount code has been successfully applied",
			});

			setCoupon("");

			client.invalidateQueries({
				queryKey: ["cloud", "coupons"],
			});
		} catch (_err: any) {
			showErrorNotification({
				title: "Failed to apply discount code",
				content: "The discount code is invalid or has already been applied",
			});
		}
	});

	const hasBilling = organization.payment_info && organization.billing_info;

	const coupons = (couponQuery.data ?? []).sort((a, b) => {
		const aActive = isCouponActive(a);
		const bActive = isCouponActive(b);

		if (aActive && !bActive) {
			return -1;
		}

		if (!aActive && bActive) {
			return 1;
		}

		return 0;
	});

	return (
		<>
			<Section
				title="Billing Information"
				description="Manage organisation payment and billing information"
			>
				<SimpleGrid
					spacing="xl"
					cols={{
						xs: 1,
						md: 2,
					}}
				>
					<BillingDetails organisation={organization} />
					<PaymentDetails organisation={organization} />
				</SimpleGrid>
			</Section>

			{showContexts && <SpectronContextSection organization={organization} />}

			<Section
				title="Discount Codes"
				description="Apply discount codes to your organisation"
			>
				<Form onSubmit={redeemCoupon}>
					<Group maw={500}>
						<TextInput
							flex={1}
							value={coupon}
							onChange={setCoupon}
							placeholder="Enter discount code"
						/>
						<Tooltip
							label="Please enter billing information before applying a discount code"
							disabled={hasBilling}
						>
							<Button
								type="submit"
								variant="gradient"
								disabled={!coupon || !hasBilling}
							>
								Apply
							</Button>
						</Tooltip>
					</Group>
				</Form>

				{coupons.length > 0 && (
					<Table
						className={classes.table}
						mt="md"
					>
						<Table.Tbody>
							{coupons.map((coupon, i) => {
								const [isExpired, expiresAt] = getExpiry(coupon);

								return (
									<Table.Tr
										key={i}
										h={42}
									>
										<Table.Td
											c="bright"
											td={isExpired ? "line-through" : undefined}
											className="selectable"
										>
											{coupon.name}
										</Table.Td>
										{isExpired ? (
											<Table.Td
												w={0}
												ta="right"
												opacity={0.6}
											>
												&mdash;
											</Table.Td>
										) : (
											<Table.Td
												w={0}
												ta="right"
											>
												<Group
													wrap="nowrap"
													gap="xs"
												>
													<Text
														c="bright"
														className="selectable"
													>
														$
														{(coupon.amount_remaining / 100).toFixed(2)}
													</Text>
													remaining
												</Group>
											</Table.Td>
										)}
										{expiresAt === null ? (
											<Table.Td
												w={200}
												ta="end"
												pr="md"
												style={{ textWrap: "nowrap" }}
											>
												Does not expire
											</Table.Td>
										) : (
											<Table.Td
												w={200}
												ta="end"
												pr="md"
												style={{ textWrap: "nowrap" }}
												c={isExpired ? "red" : undefined}
											>
												{`${isExpired ? "Expired" : "Expires in"} ${formatDistance(
													expiresAt,
													new Date(),
													{ addSuffix: true },
												)}`}
											</Table.Td>
										)}
									</Table.Tr>
								);
							})}
						</Table.Tbody>
					</Table>
				)}
			</Section>
		</>
	);
}

function SpectronContextSection({ organization }: OrganizationTabProps) {
	const { data: availablePackages, isPending: packagesPending } = useContextPackagesQuery();
	const { data: orgPackages, isSuccess: orgPackageLoaded } = useOrganizationContextPackageQuery(
		organization.id,
	);

	const cancelMutation = useCancelContextPackageMutation(organization.id);
	const [cancelModalOpen, cancelModalHandlers] = useDisclosure(false);

	const activeOrgPackage = orgPackages?.find((p) => !p.disabled_at);
	const hasActivePackage = orgPackageLoaded && !!activeOrgPackage;
	const trialActive = activeOrgPackage ? isSpectronTrialActive(activeOrgPackage) : false;

	const activePackageDetails = availablePackages?.find(
		(p) => p.id === activeOrgPackage?.package_id,
	);

	const planPath = `/o/${organization.id}/contexts/plan`;

	const confirmCancel = useStable(async () => {
		const organizationPackageId = activeOrgPackage?.package_id;

		if (!organizationPackageId) {
			return;
		}

		const wasTrialActive = isSpectronTrialActive(activeOrgPackage);

		try {
			await cancelMutation.mutateAsync(organizationPackageId);
			cancelModalHandlers.close();

			showInfo({
				title: "Package cancelled",
				subtitle: wasTrialActive
					? "Your Spectron context package has been cancelled"
					: "Your Spectron plan will end at the end of the current billing period",
			});
		} catch (_err: unknown) {
			showErrorNotification({
				title: "Failed to cancel package",
				content: "Something went wrong while cancelling your package",
			});
		}
	});

	return (
		<Section
			title="Spectron plan"
			description="Manage your Spectron context package subscription"
		>
			{hasActivePackage && activePackageDetails ? (
				<SimpleGrid
					spacing="xl"
					cols={{ base: 1, md: 2 }}
				>
					<ContextPlanCard
						pkg={activePackageDetails}
						footer={spectronContextPlanCardFooter(activeOrgPackage)}
					/>
					<Stack gap="xs">
						<Link
							href={planPath}
							style={{ display: "block" }}
						>
							<PlanAction
								name="Upgrade or change plan"
								description="Upgrade or change your Spectron plan"
								icon={iconUpload}
								w="100%"
							/>
						</Link>
						<PlanAction
							name="Cancel subscription"
							description="End your current Spectron subscription"
							icon={iconClose}
							disabled={!hasActivePackage}
							onClick={cancelModalHandlers.open}
						/>
						<Anchor
							href="https://surrealdb.com/pricing?product=spectron"
							variant="glow"
						>
							<PlanAction
								name="View pricing page"
								description="Visit the pricing page for detailed information"
								icon={iconDollar}
								w="100%"
							/>
						</Anchor>
					</Stack>
				</SimpleGrid>
			) : (
				<Skeleton visible={packagesPending || !orgPackageLoaded}>
					<Paper
						p="xl"
						className={classes.spectronCard}
					>
						<Stack gap="sm">
							<PrimaryTitle>Get started with Spectron</PrimaryTitle>
							<Text
								maw={560}
								className="selectable"
							>
								Memory without the memory tax. Knowledge graphs, entity extraction,
								temporal facts, and hybrid retrieval - built into the database, not
								bolted on top.
							</Text>
							<Group mt="md">
								<Link href={planPath}>
									<Button variant="gradient">Select a plan</Button>
								</Link>
								<Anchor
									href="https://surrealdb.com/platform/spectron"
									variant="glow"
								>
									<Button rightSection={<Icon path={iconOpen} />}>
										Learn more
									</Button>
								</Anchor>
							</Group>
							<Image
								src={pictoSpectronGradient}
								className={classes.spectronImage}
							/>
							<Image
								src={glow}
								className={classes.spectronGlow}
							/>
						</Stack>
					</Paper>
				</Skeleton>
			)}

			<Modal
				opened={cancelModalOpen}
				onClose={cancelModalHandlers.close}
				trapFocus={false}
				size="lg"
				title={<PrimaryTitle fz={20}>Cancel Spectron subscription</PrimaryTitle>}
			>
				<Stack gap="lg">
					<Text
						fz="sm"
						className="selectable"
					>
						{trialActive
							? "You are cancelling during your trial. Here is what to expect:"
							: "You are scheduling cancellation of your paid Spectron plan. Here is what to expect:"}
					</Text>
					<List
						spacing="sm"
						size="sm"
						c="bright"
						className="selectable"
					>
						{trialActive ? (
							<List.Item>
								Spectron features for this organisation will stop as soon as you
								confirm.
							</List.Item>
						) : (
							<>
								<List.Item>
									You keep full Spectron access until the end of your current
									billing period.
								</List.Item>
								<List.Item>
									Your subscription will not renew automatically after that date.
								</List.Item>
							</>
						)}
						<List.Item>
							You can subscribe again at any time from the Spectron plan section on
							this billing page.
						</List.Item>
					</List>
					<Divider />
					<Group
						mt="xs"
						wrap="nowrap"
					>
						<Button
							variant="gradient"
							onClick={cancelModalHandlers.close}
							disabled={cancelMutation.isPending}
						>
							No, keep subscription
						</Button>
						<Spacer />
						<Button
							disabled={!activeOrgPackage?.package_id}
							onClick={() => void confirmCancel()}
							loading={cancelMutation.isPending}
						>
							Yes, cancel subscription
						</Button>
					</Group>
				</Stack>
			</Modal>
		</Section>
	);
}

interface PlanActionProps extends BoxProps {
	name: string;
	description: string;
	icon: string;
	disabled?: boolean;
	onClick?: () => void;
}

function PlanAction({ name, description, icon, onClick, disabled, ...props }: PlanActionProps) {
	return (
		<UnstyledButton
			onClick={onClick}
			disabled={disabled}
			{...props}
		>
			<Anchor
				variant="glow"
				c="var(--mantine-color-text)"
				component="span"
			>
				<Paper
					px="md"
					py="sm"
				>
					<Group
						wrap="nowrap"
						gap="md"
					>
						<ThemeIcon
							color="obsidian"
							variant="light"
							size="lg"
						>
							<Icon path={icon} />
						</ThemeIcon>
						<Box
							flex={1}
							miw={0}
						>
							<Text
								c="bright"
								fw={600}
							>
								{name}
							</Text>
							<Text
								fz="sm"
								truncate
								className="selectable"
							>
								{description}
							</Text>
						</Box>
						<Icon
							path={iconChevronRight}
							size="sm"
							c="bright"
							style={{ opacity: 0.4 }}
						/>
					</Group>
				</Paper>
			</Anchor>
		</UnstyledButton>
	);
}

function isSpectronTrialActive(pkg: OrganizationContextPackage) {
	if (!pkg.trial_ends_at) {
		return false;
	}

	return new Date(pkg.trial_ends_at) > new Date();
}

function spectronContextPlanCardFooter(
	activeOrgPackage: OrganizationContextPackage | undefined,
): ReactNode {
	if (!activeOrgPackage) {
		return null;
	}

	const now = new Date();

	if (isSpectronTrialActive(activeOrgPackage) && activeOrgPackage.trial_ends_at) {
		return (
			<Text
				fz="sm"
				mt="xl"
				className="selectable"
			>
				Trial ends{" "}
				{formatDistance(new Date(activeOrgPackage.trial_ends_at), now, {
					addSuffix: true,
				})}
			</Text>
		);
	}

	const subscriptionEndsAt = activeOrgPackage.subscription_ends_at;

	if (subscriptionEndsAt && new Date(subscriptionEndsAt) > now) {
		return (
			<Text
				fz="sm"
				mt="xl"
				className="selectable"
			>
				Subscription ends{" "}
				{formatDistance(new Date(subscriptionEndsAt), now, {
					addSuffix: true,
				})}
			</Text>
		);
	}

	return null;
}

function isCouponActive(coupon: CloudCoupon) {
	if (coupon.amount_remaining <= 0) {
		return false;
	}

	if (coupon.expires_at === undefined) {
		return true;
	}

	return new Date(coupon.expires_at) > new Date();
}

function getExpiry(coupon: CloudCoupon) {
	if (coupon.expires_at === undefined) {
		return [false, null] as const;
	}

	const expiresAt = new Date(coupon.expires_at);
	const isExpired = expiresAt < new Date();

	return [isExpired, expiresAt] as const;
}
