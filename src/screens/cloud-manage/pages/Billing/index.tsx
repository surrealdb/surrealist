import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Divider, Group, List, Paper, ScrollArea, SimpleGrid, Skeleton, Stack, Table, Text } from "@mantine/core";
import { Section } from "../../components/Section";
import { Icon } from "~/components/Icon";
import { iconCheck, iconDotsVertical } from "~/util/icons";
import { ReactNode } from "react";
import { mdiAccountOutline, mdiCreditCardOutline } from "@mdi/js";
import { Spacer } from "~/components/Spacer";
import { Label } from "~/components/Label";
import { useOrganization } from "~/hooks/cloud";
import { openBillingModal } from "../../modals/billing";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { useIsLight } from "~/hooks/theme";
import { useCloudBilling } from "../../hooks/billing";

interface BillingPlanProps {
	name: string;
	description: string;
	features: string[];
	action?: ReactNode;
}

function BillingPlan({
	name,
	description,
	features,
	action,
}: BillingPlanProps) {
	const isLight = useIsLight();

	return (
		<Paper
			withBorder
			p="xl"
			w={400}
			style={{ flexShrink: 0 }}
		>
			<Stack h="100%" gap="xl">
				<Box>
					<PrimaryTitle>
						{name}
					</PrimaryTitle>
					<Text c={isLight ? "slate.7" : "slate.2"}>
						{description}
					</Text>
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
					{features.map((feature, i) => (
						<List.Item key={i} c="bright">
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

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<ScrollArea
				pos="absolute"
				scrollbars="y"
				type="scroll"
				inset={0}
				className={classes.scrollArea}
				viewportProps={{
					style: { paddingBottom: 75 }
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
						<SimpleGrid cols={2} spacing="xl">
							<Paper p="md">
								<Group>
									<Icon
										path={mdiCreditCardOutline}
										size="xl"
									/>
									<Text
										fz="xl"
										fw={600}
										c="bright"
									>
										Payment Method
									</Text>
									<Spacer />
									<Button
										color="slate"
										variant="light"
									>
										Update
									</Button>
								</Group>
								<Divider my="md" />
								<Stack mt="md">
									<Box>
										<Label>Card information</Label>
										<Skeleton visible={billingQuery.isPending}>
											{organization?.payment_info ? (
												<Text c="bright" fw={500}>Mastercard ending in 4952</Text>
											) : (
												<Text c="slate.4" fw={500}>Not provided yet</Text>
											)}
										</Skeleton>
									</Box>
									<Box>
										<Label>Name on card</Label>
										<Skeleton visible={billingQuery.isPending}>
											{organization?.payment_info ? (
												<Text c="bright" fw={500}>Tobie Morgan Hitchcock</Text>
											) : (
												<Text c="slate.4" fw={500}>Not provided yet</Text>
											)}
										</Skeleton>
									</Box>
								</Stack>
							</Paper>
							<Paper p="md">
								<Group>
									<Icon
										path={mdiAccountOutline}
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
												<Text c="bright" fw={500}>
													{billingQuery.data?.Name}
												</Text>
											) : (
												<Text c="slate.4" fw={500}>Not provided yet</Text>
											)}
										</Skeleton>
									</Box>
									<Box>
										<Label>Email</Label>
										<Skeleton visible={billingQuery.isPending}>
											{organization?.billing_info ? (
												<Text c="bright" fw={500}>
													{billingQuery.data?.Email}
												</Text>
											) : (
												<Text c="slate.4" fw={500}>Not provided yet</Text>
											)}
										</Skeleton>
									</Box>
								</Stack>
							</Paper>
						</SimpleGrid>
					</Section>

					<Section
						title="Invoices"
						description="View and download invoices of service charges"
					>
						<Table className={classes.table}>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Invoice date</Table.Th>
									<Table.Th>Status</Table.Th>
									<Table.Th>Card used</Table.Th>
									<Table.Th w={0}>Actions</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								<Table.Tr>
									<Table.Td c="bright">August 2, 2024</Table.Td>
									<Table.Td c="orange" fw={600}>Pending</Table.Td>
									<Table.Td>Mastercard ending in 4952</Table.Td>
									<Table.Td>
										<ActionIcon>
											<Icon path={iconDotsVertical} />
										</ActionIcon>
									</Table.Td>
								</Table.Tr>
								<Table.Tr>
									<Table.Td c="bright">July 2, 2024</Table.Td>
									<Table.Td c="green" fw={600}>Paid</Table.Td>
									<Table.Td>Mastercard ending in 4952</Table.Td>
									<Table.Td>
										<ActionIcon>
											<Icon path={iconDotsVertical} />
										</ActionIcon>
									</Table.Td>
								</Table.Tr>
								<Table.Tr>
									<Table.Td c="bright">June 2, 2024</Table.Td>
									<Table.Td c="green" fw={600}>Paid</Table.Td>
									<Table.Td>Mastercard ending in 4952</Table.Td>
									<Table.Td>
										<ActionIcon>
											<Icon path={iconDotsVertical} />
										</ActionIcon>
									</Table.Td>
								</Table.Tr>
							</Table.Tbody>
						</Table>
					</Section>
				</Stack>
			</ScrollArea>
		</Box>
	);
}