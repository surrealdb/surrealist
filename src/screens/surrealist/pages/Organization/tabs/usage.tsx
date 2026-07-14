import {
	Group,
	LoadingOverlay,
	Paper,
	Select,
	SimpleGrid,
	Stack,
	Table,
	Text,
	type TextProps,
	Tooltip,
} from "@mantine/core";
import { Icon, iconClock, iconDatabase, iconDollar, iconServer } from "@surrealdb/ui";
import { format, subMonths } from "date-fns";
import { useMemo, useState } from "react";
import { useCloudOrgSpendQuery } from "~/cloud/queries/usage";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { formatBytesUsage, formatMillcents, formatMinutesAsHours } from "~/util/cloud";
import classes from "../style.module.scss";
import { OrganizationTabProps } from "../types";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
	const month = subMonths(new Date(), i);
	return {
		value: format(month, "MM-yyyy"),
		label: format(month, "MMMM yyyy"),
	};
});

function spendTextProps(millcents: number): TextProps {
	if (millcents > 0) return { c: "bright", fw: 500, ff: "monospace" };
	if (millcents === 0) return { fw: 300, ff: "monospace" };
	return { c: "orange", fw: 500, ff: "monospace" };
}

export function OrganizationUsageTab({ organization }: OrganizationTabProps) {
	const [period, setPeriod] = useState(() => MONTH_OPTIONS[0].value);

	const spendQuery = useCloudOrgSpendQuery(organization.id, period);
	const entries = spendQuery.data ?? [];

	const totalMillcents = useMemo(
		() => entries.reduce((sum, e) => sum + (e.amount_millcents || 0), 0),
		[entries],
	);

	const totalComputeMinutes = useMemo(
		() =>
			entries
				.filter((e) => e.resource.includes("compute"))
				.reduce((sum, e) => sum + (e.units || 0), 0),
		[entries],
	);

	const totalStorageBytes = useMemo(
		() =>
			entries
				.filter((e) => e.resource.includes("storage"))
				.reduce((sum, e) => sum + (e.units || 0), 0),
		[entries],
	);

	const uniqueInstances = useMemo(
		() => new Set(entries.filter((e) => e.instance_id).map((e) => e.instance_id)).size,
		[entries],
	);

	return (
		<>
			<Group
				justify="space-between"
				align="center"
			>
				<PrimaryTitle fz={32}>Usage</PrimaryTitle>
				<Select
					value={period}
					onChange={(value) => value && setPeriod(value)}
					data={MONTH_OPTIONS}
					allowDeselect={false}
					w={180}
				/>
			</Group>

			<Section
				title="Usage overview"
				description="Your organisation's credit usage breakdown for the selected period"
			>
				<SimpleGrid cols={{ xs: 2, md: 4 }}>
					<SummaryCard
						icon={iconDollar}
						label="Total spend"
						value={formatMillcents(totalMillcents)}
					/>
					<SummaryCard
						icon={iconClock}
						label="Total compute"
						value={formatMinutesAsHours(totalComputeMinutes)}
					/>
					<SummaryCard
						icon={iconDatabase}
						label="Total storage"
						value={formatBytesUsage(totalStorageBytes)}
					/>
					<SummaryCard
						icon={iconServer}
						label="Instances"
						value={String(uniqueInstances)}
					/>
				</SimpleGrid>
			</Section>

			<Section
				title="Usage breakdown"
				description="Individual ledger entries for the selected period"
			>
				<Paper
					p="md"
					pos="relative"
					style={{ overflow: "auto" }}
				>
					<LoadingOverlay
						visible={spendQuery.isPending}
						overlayProps={{
							color: "var(--mantine-color-obsidian-8)",
						}}
					/>

					{entries.length === 0 && !spendQuery.isPending ? (
						<Text mt="xs">No spend data available for this period</Text>
					) : (
						<Table className={classes.table}>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Description</Table.Th>
									<Table.Th>Instance</Table.Th>
									<Table.Th>Type</Table.Th>
									<Table.Th>Units</Table.Th>
									<Table.Th ta="right">Spend</Table.Th>
									<Table.Th ta="right">Date</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{entries.map((entry, i) => {
									const isCompute =
										entry.resource.includes("compute") &&
										(entry.units ?? 0) > 0;
									const isStorage =
										entry.resource.includes("storage") &&
										(entry.units ?? 0) > 0;

									return (
										<Table.Tr
											key={i}
											h={42}
										>
											<Table.Td>
												{entry.description ? (
													<Tooltip
														label={entry.description}
														multiline
														maw={300}
													>
														<Text
															fz="sm"
															lineClamp={1}
															style={{ cursor: "help" }}
															c="bright"
														>
															{entry.description}
														</Text>
													</Tooltip>
												) : (
													<Text fz="sm">&mdash;</Text>
												)}
											</Table.Td>
											<Table.Td>
												<Text fz="sm">{entry.instance_id}</Text>
											</Table.Td>
											<Table.Td>
												<Text fz="sm">
													{entry.instance_type || "\u2014"}
												</Text>
											</Table.Td>
											<Table.Td>
												{isCompute ? (
													<Group
														gap="xs"
														c="blue"
													>
														<Icon path={iconClock} />
														<Text fz="sm">
															{formatMinutesAsHours(entry.units ?? 0)}
														</Text>
													</Group>
												) : isStorage ? (
													<Group
														gap="xs"
														c="green"
													>
														<Icon path={iconDatabase} />
														<Text fz="sm">
															{formatBytesUsage(entry.units ?? 0)}
														</Text>
													</Group>
												) : (entry.units ?? 0) > 0 ? (
													<Text fz="sm">{entry.units}</Text>
												) : (
													<Text fz="sm">&mdash;</Text>
												)}
											</Table.Td>
											<Table.Td ta="right">
												<Text
													fz="sm"
													{...spendTextProps(entry.amount_millcents)}
												>
													{formatMillcents(entry.amount_millcents)}
												</Text>
											</Table.Td>
											<Table.Td ta="right">
												<Text fz="sm">
													{entry.effective_at
														? format(
																new Date(entry.effective_at),
																"MMM d, yyyy",
															)
														: "\u2014"}
												</Text>
											</Table.Td>
										</Table.Tr>
									);
								})}
							</Table.Tbody>
						</Table>
					)}
				</Paper>
			</Section>
		</>
	);
}

interface SummaryCardProps {
	icon: string;
	label: string;
	value: string;
}

function SummaryCard({ icon, label, value }: SummaryCardProps) {
	return (
		<Paper p="lg">
			<Stack gap="xs">
				<Group gap="xs">
					<Icon
						path={icon}
						size="sm"
						c="violet"
					/>
					<Text fz="sm">{label}</Text>
				</Group>
				<Text
					fz="xl"
					fw={600}
					c="bright"
				>
					{value}
				</Text>
			</Stack>
		</Paper>
	);
}
