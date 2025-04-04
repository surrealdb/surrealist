import cloudImg from "~/assets/images/cloud-icon.webp";
import classes from "./style.module.scss";

import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Image,
	LoadingOverlay,
	Paper,
	ScrollArea,
	Select,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import { iconAccount, iconChevronRight, iconCreditCard, iconHelp, iconOpen } from "~/util/icons";

import { useInputState, useWindowEvent } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { capitalize } from "radash";
import { useRef, useState } from "react";
import { adapter } from "~/adapter";
import { fetchAPI, updateCloudInformation } from "~/cloud/api";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useCloudBillingQuery } from "~/cloud/queries/billing";
import { useCloudCouponsQuery } from "~/cloud/queries/coupons";
import { useCloudInvoicesQuery } from "~/cloud/queries/invoices";
import { useCloudPaymentsQuery } from "~/cloud/queries/payments";
import { useCloudOrgUsageQuery } from "~/cloud/queries/usage";
import { CloudSplash } from "~/components/CloudSplash";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useIsAuthenticated, useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import type { CloudCoupon, InvoiceStatus } from "~/types";
import { measureComputeCost } from "~/util/cloud";
import { showError, showInfo } from "~/util/helpers";
import { openBillingDetails } from "../../../../cloud/modals/billing";
import { Section } from "../../../../components/Section";

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

const INVOICE_STATUSES: Record<InvoiceStatus, { name: string; color: string }> = {
	succeeded: { name: "Paid", color: "green" },
	pending: { name: "Pending", color: "orange" },
	failed: { name: "Failed", color: "red" },
};

interface BillingPlanProps {
	name: string;
	description: string;
}

function BillingPlan({ name, description }: BillingPlanProps) {
	const isLight = useIsLight();

	return (
		<Paper p="xl">
			<Group>
				<Box flex={1}>
					<PrimaryTitle>{name}</PrimaryTitle>
					<Text c={isLight ? "slate.7" : "slate.2"}>{description}</Text>
				</Box>
				<Button
					variant="gradient"
					rightSection={<Icon path={iconOpen} />}
					onClick={() => adapter.openUrl("https://surrealdb.com/pricing")}
				>
					View plans
				</Button>
			</Group>
		</Paper>
	);
}

export function BillingPage() {
	const { setSelectedOrganization } = useCloudStore.getState();

	const isAuthed = useIsAuthenticated();
	const organization = useOrganization();
	const organizations = useCloudStore((state) => state.organizations);
	const billingQuery = useCloudBillingQuery(organization?.id);
	const paymentQuery = useCloudPaymentsQuery(organization?.id);
	const invoiceQuery = useCloudInvoicesQuery(organization?.id);
	const couponQuery = useCloudCouponsQuery(organization?.id);
	const usageQuery = useCloudOrgUsageQuery(organization?.id);
	const queryClient = useQueryClient();

	const [requesting, setRequesting] = useState(false);
	const [coupon, setCoupon] = useInputState("");
	const hasRequested = useRef(false);

	const requestPaymentUrl = useStable(async () => {
		setRequesting(true);
		hasRequested.current = true;

		try {
			const url = await fetchAPI<string>(`/organizations/${organization?.id}/payment/url`);

			adapter.openUrl(url);
		} finally {
			setRequesting(false);
		}
	});

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

			queryClient.invalidateQueries({
				queryKey: ["cloud", "coupons"],
			});
		} catch (err: any) {
			showError({
				title: "Failed to apply discount code",
				subtitle: "The discount code is invalid or has already been applied",
			});
		}
	});

	useWindowEvent("focus", async () => {
		if (!organization || !hasRequested.current) return;

		await fetchAPI(`/organizations/${organization?.id}/payment`, {
			method: "PUT",
		});

		updateCloudInformation();

		queryClient.invalidateQueries({
			queryKey: ["cloud", "payments", organization.id],
		});
	});

	const cardBrand = paymentQuery.data?.info?.card_brand ?? "";
	const cardLast4 = paymentQuery.data?.info?.card_last4 ?? "";
	const cardDescription = `${capitalize(cardBrand)} ending in ${cardLast4}`;
	const usageCharge = measureComputeCost(usageQuery.data ?? []);

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
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={200} />

			{isAuthed ? (
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
						gap={42}
						mx="auto"
						maw={1100}
						mt={75}
					>
						<Group>
							<Box>
								<PrimaryTitle fz={26}>Cloud Billing</PrimaryTitle>
								<Text fz="xl">View and manage your billing information</Text>
							</Box>
							<Spacer />
							<Select
								value={organization?.id ?? ""}
								onChange={setSelectedOrganization as any}
								data={organizations.map((org) => ({
									value: org.id,
									label: org.name,
								}))}
							/>
						</Group>
						<Section
							title="Your plan"
							description="The plan active for this organization"
						>
							<Skeleton visible={!organization?.plan}>
								<BillingPlan
									name={organization?.plan?.name ?? ""}
									description={organization?.plan?.description ?? ""}
								/>
							</Skeleton>
						</Section>

						<Section
							title="Usage charges"
							description="Your organization's usage charges for the current month"
						>
							<Paper
								p="xl"
								pos="relative"
								style={{ overflow: "hidden" }}
							>
								<LoadingOverlay
									visible={usageQuery.isPending}
									overlayProps={{
										color: "var(--mantine-color-slate-8)",
									}}
								/>
								<Label>Usage cost breakdown</Label>
								{usageCharge.summary.length === 0 ? (
									<Text
										mt="xs"
										c="slate"
									>
										No instance usage data available yet
									</Text>
								) : (
									<Table
										className={classes.table}
										mt="sm"
									>
										<Table.Tbody>
											{usageCharge.summary.map((charge) => (
												<Table.Tr
													key={charge.name}
													h={42}
												>
													<Table.Td c="bright">{charge.name}</Table.Td>
													<Table.Td
														w={0}
														pr="md"
														style={{ textWrap: "nowrap" }}
													>
														<Text
															span
															c="bright"
															fw={500}
														>
															${charge.cost.toFixed(3)}
														</Text>{" "}
														<Text span>
															for {charge.hours.toString()} compute
															hours
														</Text>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								)}
								<Divider my="xl" />
								<Label>Total charges this month to date</Label>
								<PrimaryTitle>${usageCharge.total.toFixed(2)}</PrimaryTitle>

								<Text
									fz="sm"
									c="slate"
									mt="sm"
								>
									This amount is an estimation, final amounts may vary.
								</Text>
							</Paper>
						</Section>

						<Section
							title="Billing Information"
							description="Manage organization payment and billing information"
						>
							<SimpleGrid
								cols={{
									xs: 1,
									md: 2,
								}}
								spacing="xl"
							>
								<Paper p="xl">
									<Group>
										<Icon
											path={iconAccount}
											size="xl"
										/>
										<Text
											fz="xl"
											fw={600}
											c="bright"
										>
											Billing Details
										</Text>
										<Spacer />
										<Button
											color="slate"
											variant="light"
											onClick={openBillingDetails}
										>
											Edit
										</Button>
									</Group>
									<Divider my="md" />
									<Stack>
										<Box>
											<Label>Name</Label>
											<Skeleton visible={billingQuery.isPending}>
												{organization?.billing_info ? (
													<Text
														c="bright"
														fw={500}
													>
														{billingQuery.data?.Name}
													</Text>
												) : (
													<Text
														c="slate.4"
														fw={500}
													>
														Not provided yet
													</Text>
												)}
											</Skeleton>
										</Box>
										<Box>
											<Label>Email</Label>
											<Skeleton visible={billingQuery.isPending}>
												{organization?.billing_info ? (
													<Text
														c="bright"
														fw={500}
													>
														{billingQuery.data?.Email}
													</Text>
												) : (
													<Text
														c="slate.4"
														fw={500}
													>
														Not provided yet
													</Text>
												)}
											</Skeleton>
										</Box>
									</Stack>
								</Paper>
								<Paper p="xl">
									<Group>
										<Icon
											path={iconCreditCard}
											size="xl"
										/>
										<Text
											fz="xl"
											fw={600}
											c="bright"
										>
											Payment Details
										</Text>
										<Spacer />
										<Tooltip
											disabled={organization?.billing_info}
											label="Please provide billing details first"
										>
											<Button
												color="slate"
												variant="light"
												loading={requesting}
												onClick={requestPaymentUrl}
												disabled={!organization?.billing_info}
											>
												Edit
											</Button>
										</Tooltip>
									</Group>
									<Divider my="md" />
									<Stack mt="md">
										<Box>
											<Label>Payment method</Label>
											<Skeleton visible={paymentQuery.isPending}>
												{organization?.payment_info ? (
													<Text
														c="bright"
														fw={500}
													>
														Credit Card
													</Text>
												) : (
													<Text
														c="slate.4"
														fw={500}
													>
														Not provided yet
													</Text>
												)}
											</Skeleton>
										</Box>
										<Box>
											<Label>Card information</Label>
											<Skeleton visible={paymentQuery.isPending}>
												{organization?.payment_info ? (
													<Text
														c="bright"
														fw={500}
													>
														{cardDescription}
													</Text>
												) : (
													<Text
														c="slate.4"
														fw={500}
													>
														Not provided yet
													</Text>
												)}
											</Skeleton>
										</Box>
									</Stack>
								</Paper>
							</SimpleGrid>
						</Section>

						<Section
							title="Discount Codes"
							description="Apply discount codes to your organization"
						>
							<Form onSubmit={redeemCoupon}>
								<Group maw={500}>
									<TextInput
										flex={1}
										value={coupon}
										onChange={setCoupon}
										placeholder="Enter discount code"
									/>
									<Button
										type="submit"
										variant="gradient"
										disabled={!coupon}
									>
										Apply
									</Button>
								</Group>
							</Form>

							{coupons.length > 0 && (
								<Table
									className={classes.table}
									mt="md"
								>
									<Table.Tbody>
										{coupons.map((coupon) => {
											const [isExpired, expiresAt] = getExpiry(coupon);

											return (
												<Table.Tr
													key={coupon.id}
													h={42}
												>
													<Table.Td
														c="bright"
														td={isExpired ? "line-through" : undefined}
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
																<Text c="bright">
																	$
																	{(
																		coupon.amount_remaining /
																		100
																	).toFixed(2)}
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

						<Section
							title="Invoices"
							description="View and download invoices of service charges"
						>
							{invoiceQuery.isPending ? (
								<Stack>
									<Skeleton height={40} />
									<Skeleton height={40} />
									<Skeleton height={40} />
								</Stack>
							) : invoiceQuery.data?.length ? (
								<Table className={classes.table}>
									{/* <Table.Thead>
										<Table.Tr>
											<Table.Th>Invoice date</Table.Th>
											<Table.Th>Status</Table.Th>
											<Table.Th>Amount</Table.Th>
											<Table.Th w={0}>Actions</Table.Th>
										</Table.Tr>
									</Table.Thead> */}
									<Table.Tbody>
										{invoiceQuery.data?.map((invoice) => {
											const status = INVOICE_STATUSES[invoice.status];

											return (
												<Table.Tr key={invoice.id}>
													<Table.Td c="bright">
														{new Date(
															invoice.date,
														).toLocaleDateString()}
													</Table.Td>
													<Table.Td
														c={status?.color ?? "slate"}
														fw={600}
													>
														{status?.name ?? invoice.status}
													</Table.Td>
													<Table.Td>
														${(invoice.amount / 100).toFixed(2)} USD
													</Table.Td>
													<Table.Td
														w={0}
														pr="md"
														style={{ textWrap: "nowrap" }}
													>
														<Link href={invoice.url}>
															<ActionIcon>
																<Icon path={iconOpen} />
															</ActionIcon>
														</Link>
													</Table.Td>
												</Table.Tr>
											);
										})}
									</Table.Tbody>
								</Table>
							) : (
								<Alert
									icon={<Icon path={iconHelp} />}
									title="Your organization has no invoices yet"
									color="blue"
									pr="xl"
								>
									Once you have invoices, you can view and download them here
								</Alert>
							)}
						</Section>
					</Stack>
				</ScrollArea>
			) : (
				<CloudSplash />
			)}
		</Box>
	);
}
