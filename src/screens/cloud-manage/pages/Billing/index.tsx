import classes from "./style.module.scss";
import { ActionIcon, Box, Button, Center, Divider, Group, List, Paper, ScrollArea, SimpleGrid, Stack, Table, Text } from "@mantine/core";
import { Section } from "../../components/Section";
import { Icon } from "~/components/Icon";
import { iconCheck, iconDotsVertical } from "~/util/icons";
import { ReactNode } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { mdiAccountOutline, mdiCreditCardOutline } from "@mdi/js";
import { Spacer } from "~/components/Spacer";
import { Label } from "~/components/Label";

interface BillingPlanProps {
	name: string;
	pricing: ReactNode;
	features: string[];
	action: ReactNode;
	audience: string;
}

function BillingPlan({
	name,
	pricing,
	features,
	action,
}: BillingPlanProps) {
	return (
		<Box>
			<Paper
				withBorder
				p="xl"
			>
				<Stack h="100%" gap="xl">
					<Box>
						<Text fz="xl">
							{name}
						</Text>
						{pricing}
					</Box>
					<List
						className={classes.featureList}
						icon={
							<Center
								className={classes.featureIcon}
								w={18}
								h={18}
							>
								<Icon path={iconCheck} c="bright" size="sm" />
							</Center>
						}
					>
						{features.map((feature, i) => (
							<List.Item key={i}>
								{feature}
							</List.Item>
						))}
					</List>
					<Spacer />
					{action}
				</Stack>
			</Paper>
		</Box>
	);
}

export function BillingPage() {
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
					<Box>
						<PrimaryTitle ta="center">
							Surreal Cloud Pricing Plans
						</PrimaryTitle>
						<Text ta="center" fz="lg">
							Choose a plan that fits your organization's needs
						</Text>
					</Box>
					<ScrollArea
						scrollbars="x"
					>
						<SimpleGrid
							my="xl"
							spacing="xl"
							cols={3}
							w={900}
							mx="auto"
						>
							<BillingPlan
								name="Start"
								audience="beginners"
								features={[
									"Some feature",
									"Another feature",
									"Exciting feature",
								]}
								pricing={
									<Text
										fz={28}
										fw={500}
										c="bright"
									>
										Free
									</Text>
								}
								action={
									<Text c="bright">
										You are automatically enrolled in this plan
									</Text>
								}
							/>
							<BillingPlan
								name="Grow"
								audience="professionals"
								features={[
									"Spicy feature",
									"Premium feature",
									"Enticing feature",
									"Thrilling feature",
									"Suprising feature",
									"Awesome feature",
								]}
								pricing={
									<Text
										fz={28}
										fw={500}
										c="bright"
									>
										$10<Text span c="slate.2">/mo</Text>
									</Text>
								}
								action={
									<Button
										variant="gradient"
										size="xs"
									>
										Upgrade to grow
									</Button>
								}
							/>
							<BillingPlan
								name="Scale"
								audience="large organizations"
								features={[
									"Unbelievable feature",
									"Cheerful feature",
									"Exceptional feature",
									"Best feature",
								]}
								pricing={
									<Text
										fz={28}
										fw={500}
										c="bright"
									>
										Contact us
									</Text>
								}
								action={
									<Button
										variant="gradient"
										size="xs"
									>
										Contact us
									</Button>
								}
							/>
						</SimpleGrid>
					</ScrollArea>

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
									>
										Update
									</Button>
								</Group>
								<Divider
									color="slate.7"
									my="md"
								/>
								<Stack mt="md">
									<Box>
										<Label>Card information</Label>
										<Text c="bright" fw={500}>Mastercard ending in 4952</Text>
									</Box>
									<Box>
										<Label>Name on card</Label>
										<Text c="bright" fw={500}>Tobie Morgan Hitchcock</Text>
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
									>
										Update
									</Button>
								</Group>
								<Divider
									color="slate.7"
									my="md"
								/>
								<Stack>
									<Box>
										<Label>Name</Label>
										<Text c="bright" fw={500}>Tobie Morgan Hitchcock</Text>
									</Box>
									<Box>
										<Label>Email</Label>
										<Text c="bright" fw={500}>tobie@surrealdb.com</Text>
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