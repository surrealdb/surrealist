import classes from "../style.module.scss";

import {
	Box,
	Button,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import { useInputState } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistance } from "date-fns";
import { fetchAPI } from "~/cloud/api";
import { useCloudCouponsQuery } from "~/cloud/queries/coupons";
import { Form } from "~/components/Form";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import { CloudCoupon } from "~/types";
import { showErrorNotification, showInfo } from "~/util/helpers";
import { iconOpen } from "~/util/icons";
import { OrganizationTabProps } from "../types";
import { BillingDetails } from "~/components/BillingDetails";
import { PaymentDetails } from "~/components/PaymentDetails";

export function OrganizationBillingTab({ organization }: OrganizationTabProps) {
	const client = useQueryClient();
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
		} catch (err: any) {
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
					<BillingDetails organisation={organization} />
					<PaymentDetails organisation={organization} />
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
