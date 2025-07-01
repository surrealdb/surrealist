import classes from "../style.module.scss";

import { Divider, LoadingOverlay, Paper, Table, Text } from "@mantine/core";
import { useCloudOrgUsageQuery } from "~/cloud/queries/usage";
import { Label } from "~/components/Label";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { measureComputeCost } from "~/util/cloud";
import { OrganizationTabProps } from "../types";

export function OrganizationUsageTab({ organization }: OrganizationTabProps) {
	const usageQuery = useCloudOrgUsageQuery(organization.id);

	const usageCharge = measureComputeCost(usageQuery.data ?? []);

	return (
		<Section
			title="Usage charges"
			description="Your organisation's usage charges for the current month"
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
							{usageCharge.summary.map((charge, i) => (
								<Table.Tr
									key={i}
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
											for {charge.hours.toString()} compute hours
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
	);
}
