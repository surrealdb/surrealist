import classes from "./style.module.scss";

import {
	ActionIcon,
	Alert,
	Box,
	Button,
	Divider,
	Group,
	List,
	Paper,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Table,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";

import {
	iconAccount,
	iconCheck,
	iconCreditCard,
	iconHelp,
	iconOpen,
} from "~/util/icons";

import { useInputState, useWindowEvent } from "@mantine/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { capitalize } from "radash";
import { type ReactNode, useRef, useState } from "react";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { Label } from "~/components/Label";
import { Link } from "~/components/Link";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useOrganization } from "~/hooks/cloud";
import { useStable } from "~/hooks/stable";
import { useIsLight } from "~/hooks/theme";
import type { InvoiceStatus } from "~/types";
import { showInfo } from "~/util/helpers";
import { fetchAPI } from "../../api";
import { Section } from "../../components/Section";
import { useCloudBilling } from "../../hooks/billing";
import { useCloudInvoices } from "../../hooks/invoices";
import { useCloudPayments } from "../../hooks/payments";
import { openBillingModal } from "../../modals/billing";

const INVOICE_STATUSES: Record<InvoiceStatus, { name: string; color: string }> = {
	succeeded: { name: "Paid", color: "green" },
	pending: { name: "Pending", color: "orange" },
	failed: { name: "Failed", color: "red" },
};

interface BillingPlanProps {
	name: string;
	description: string;
	features: string[];
	action?: ReactNode;
}

function BillingPlan({ name, description, features, action }: BillingPlanProps) {
	const isLight = useIsLight();

	return (
		<Paper
			withBorder
			p="xl"
			w={400}
			style={{ flexShrink: 0 }}
		>
			<Stack
				h="100%"
				gap="xl"
			>
				<Box>
					<PrimaryTitle>{name}</PrimaryTitle>
					<Text c={isLight ? "slate.7" : "slate.2"}>{description}</Text>
				</Box>
				<List
					className={classes.featureList}
					icon={
						<Icon
							path={iconCheck}
							color="surreal.5"
						/>
					}
				>
					{features.map((feature) => (
						<List.Item
							key={feature}
							c="bright"
						>
							{feature}
						</List.Item>
					))}
				</List>
				{action}
			</Stack>
		</Paper>
	);
}

export function BillingPage() {
	const organization = useOrganization();
	const billingQuery = useCloudBilling(organization?.id);
	const paymentQuery = useCloudPayments(organization?.id);
	const invoiceQuery = useCloudInvoices(organization?.id);
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
		} catch(err: any) {
			showInfo({
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

		queryClient.invalidateQueries({
			queryKey: ["cloud", "payments", organization.id],
		});
	});

	const cardBrand = paymentQuery.data?.info?.card_brand ?? "";
	const cardLast4 = paymentQuery.data?.info?.card_last4 ?? "";
	const cardDescription = `${capitalize(cardBrand)} ending in ${cardLast4}`;

	return (
		<Box
			flex={1}
			pos="relative"
			w="100%"
			maw={900}
			mx="auto"
		>
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
				<Stack>
					{/* <Section
						title={
							<Group>
								Choose your plan
								<Badge variant="light">
									Coming soon
								</Badge>
							</Group>
						}
						description="Pick a plan that suits your organization's needs"
					>
						<ScrollArea
							scrollbars="x"
						>
							<Group wrap="nowrap">
								{organization?.available_plans?.map((plan) => (
									<BillingPlan
										key={plan.id}
										name={plan.name}
										description={plan.description}
										features={[]}
										pricing={null}
										action={
											<Button
												variant="gradient"
												size="xs"
											>
												Select plan
											</Button>
										}
									/>
								))}
							</Group>
						</ScrollArea>
					</Section> */}

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
							<Paper p="md">
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
										onClick={openBillingModal}
									>
										Update
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
							<Paper p="md">
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
											Update
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
						<Group maw={500}>
							<TextInput
								flex={1}
								value={coupon}
								onChange={setCoupon}
								placeholder="Enter discount code"
							/>
							<Button
								variant="gradient"
								disabled={!coupon}
								onClick={redeemCoupon}
							>
								Apply
							</Button>
						</Group>
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
													{new Date(invoice.date).toLocaleDateString()}
												</Table.Td>
												<Table.Td
													c={status.color}
													fw={600}
												>
													{status.name}
												</Table.Td>
												<Table.Td>
													${(invoice.amount * 100).toFixed(2)} USD
												</Table.Td>
												<Table.Td>
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
		</Box>
	);
}
