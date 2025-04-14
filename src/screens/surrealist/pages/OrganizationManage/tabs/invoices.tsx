import classes from "../style.module.scss";

import { ActionIcon, Alert, Paper, Skeleton, Stack, Table } from "@mantine/core";
import { Link } from "wouter";
import { useCloudInvoicesQuery } from "~/cloud/queries/invoices";
import { Icon } from "~/components/Icon";
import { Section } from "~/components/Section";
import { InvoiceStatus } from "~/types";
import { iconHelp, iconOpen } from "~/util/icons";
import { OrganizationTabProps } from "../types";

const INVOICE_STATUSES: Record<InvoiceStatus, { name: string; color: string }> = {
	succeeded: { name: "Paid", color: "green" },
	pending: { name: "Pending", color: "orange" },
	failed: { name: "Failed", color: "red" },
};

export function OrganizationInvoicesTab({ organization }: OrganizationTabProps) {
	const invoiceQuery = useCloudInvoicesQuery(organization.id);

	return (
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
						title="Your organisation has no invoices yet"
						color="blue"
						pr="xl"
					>
						Once you have invoices, you can view and download them here
					</Alert>
				)}
			</Paper>
		</Section>
	);
}
