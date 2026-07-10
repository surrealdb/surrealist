import {
	ActionIcon,
	Alert,
	Anchor,
	Box,
	Group,
	Paper,
	Skeleton,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { Icon, iconChart, iconChevronRight, iconHelp, iconOpen } from "@surrealdb/ui";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { useCloudInvoicesQuery } from "~/cloud/queries/invoices";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { InvoiceStatus } from "~/types";
import classes from "../style.module.scss";
import { OrganizationTabProps } from "../types";

const INVOICE_STATUSES: Record<InvoiceStatus, { name: string; color: string }> = {
	succeeded: { name: "Paid", color: "green" },
	pending: { name: "Pending", color: "orange" },
	failed: { name: "Failed", color: "red" },
};

export function OrganizationInvoicesTab({ organization }: OrganizationTabProps) {
	const invoiceQuery = useCloudInvoicesQuery(organization.id);

	return (
		<>
			<PrimaryTitle fz={32}>Invoices</PrimaryTitle>

			<Anchor
				component={Link}
				href={`/o/${organization.id}/usage`}
				variant="glow"
				c="var(--mantine-color-text)"
				mb="xl"
			>
				<Paper p="lg">
					<Group
						gap="md"
						wrap="nowrap"
					>
						<ThemeIcon
							color="violet"
							variant="light"
							size={44}
							radius="md"
						>
							<Icon
								path={iconChart}
								size="lg"
							/>
						</ThemeIcon>
						<Box style={{ flex: 1 }}>
							<Text
								c="bright"
								fw={600}
								fz="lg"
							>
								View your usage breakdown
							</Text>
							<Text fz="sm">
								Head to the usage page for a detailed breakdown of compute, storage,
								and spend across your instances for any month in the past year.
							</Text>
						</Box>
						<Icon
							path={iconChevronRight}
							c="slate"
						/>
					</Group>
				</Paper>
			</Anchor>

			<Section
				title="Invoices"
				description="View and download invoices of service charges"
			>
				<Paper p="md">
					{invoiceQuery.isPending ? (
						<Stack>
							<Skeleton height={40} />
							<Skeleton height={40} />
							<Skeleton height={40} />
						</Stack>
					) : invoiceQuery.data?.length ? (
						<Table className={classes.table}>
							<Table.Tbody>
								{invoiceQuery.data?.map((invoice) => {
									const status = INVOICE_STATUSES[invoice.status];

									return (
										<Table.Tr key={invoice.id}>
											<Table.Td c="bright">
												{new Date(invoice.date).toLocaleDateString()}
											</Table.Td>
											<Table.Td
												c={status?.color ?? "obsidian"}
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
												<ActionIcon
													onClick={() => adapter.openUrl(invoice.url)}
												>
													<Icon path={iconOpen} />
												</ActionIcon>
											</Table.Td>
										</Table.Tr>
									);
								})}
							</Table.Tbody>
						</Table>
					) : (
						<Alert
							icon={<Icon path={iconHelp} />}
							title="Your organisation has no invoices yet"
							color="blue"
							pr="xl"
						>
							Once you have invoices, you can view and download them here
						</Alert>
					)}
				</Paper>
			</Section>
		</>
	);
}
