import classes from "../style.module.scss";

import {
	Box,
	Button,
	Divider,
	Group,
	Paper,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import { useInputState, useWindowEvent } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { capitalize } from "radash";
import { useRef, useState } from "react";
import { adapter } from "~/adapter";
import { fetchAPI, updateCloudInformation } from "~/cloud/api";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
import { openBillingDetails } from "~/cloud/modals/billing";
import { useCloudBillingQuery } from "~/cloud/queries/billing";
import { useCloudCouponsQuery } from "~/cloud/queries/coupons";
import { useCloudPaymentsQuery } from "~/cloud/queries/payments";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { Spacer } from "~/components/Spacer";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { CloudCoupon } from "~/types";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { iconAccount, iconCreditCard, iconOpen } from "~/util/icons";
import { OrganizationTabProps } from "../types";

export function OrganizationBillingTab({ organization }: OrganizationTabProps) {
	const isOwner = useHasOrganizationRole(organization.id, "owner");
	const client = useQueryClient();

	const billingQuery = useCloudBillingQuery(organization.id);
	const paymentQuery = useCloudPaymentsQuery(organization.id);
	const couponQuery = useCloudCouponsQuery(organization.id);

	const [requesting, setRequesting] = useState(false);
	const [coupon, setCoupon] = useInputState("");
	const hasRequested = useRef(false);

	const requestPaymentUrl = useStable(async () => {
		setRequesting(true);
		hasRequested.current = true;

		try {
			const url = await fetchAPI<string>(`/organizations/${organization?.id}/payment/url`);

			adapter.openUrl(url);
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to open payment page",
				content: err,
			});
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

			client.invalidateQueries({
				queryKey: ["cloud", "coupons"],
			});
		} catch (err: any) {
			showErrorNotification({
				title: "Failed to apply discount code",
				content: "The discount code is invalid or has already been applied",
			});
		}
	});

	const handleEditBilling = useStable(() => {
		openBillingDetails(organization);
	});

	useWindowEvent("focus", async () => {
		if (!organization || !hasRequested.current) return;

		await fetchAPI(`/organizations/${organization?.id}/payment`, {
			method: "PUT",
		});

		updateCloudInformation();

		client.invalidateQueries({
			queryKey: ["cloud", "payments", organization.id],
		});
	});

	const hasBilling = organization.payment_info && organization.billing_info;
	const cardBrand = paymentQuery.data?.info?.card_brand ?? "";
	const cardLast4 = paymentQuery.data?.info?.card_last4 ?? "";
	const cardDescription = `${capitalize(cardBrand)} ending in ${cardLast4}`;

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
		<Stack>
			<Section
				title="Support Plan"
				description="The support plan for this organisation"
			>
				{/* <Skeleton visible={!organization?.plan}> */}
				<SupportPlan
					name="Community"
					description="Receive help from community members on Discord and GitHub"
				/>
				{/* </Skeleton> */}
			</Section>
			<Section
				title="Billing Information"
				description="Manage organisation payment and billing information"
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
							{isOwner && (
								<Button
									color="slate"
									variant="light"
									onClick={handleEditBilling}
								>
									Edit
								</Button>
							)}
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
							{isOwner && (
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
							)}
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
		</Stack>
	);
}

interface SupportPlanProps {
	name: string;
	description: string;
}

function SupportPlan({ name, description }: SupportPlanProps) {
	const isLight = useIsLight();

	return (
		<Paper p="xl">
			<Group>
				<Box flex={1}>
					<PrimaryTitle>{name}</PrimaryTitle>
					<Text c={isLight ? "slate.7" : "slate.2"}>{description}</Text>
				</Box>
				<Tooltip label="More support options coming soon">
					<Button
						variant="gradient"
						disabled
						rightSection={
							<Icon
								path={iconOpen}
								size="md"
							/>
						}
					>
						Upgrade Plan
					</Button>
				</Tooltip>
			</Group>
		</Paper>
	);
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
