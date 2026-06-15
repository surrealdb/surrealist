import {
	Badge,
	Box,
	Group,
	Paper,
	Progress,
	Skeleton,
	Stack,
	Table,
	Text,
	ThemeIcon,
} from "@mantine/core";
import { Icon, iconChart, iconClock, pictoPieChartGradient, SectionTitle } from "@surrealdb/ui";
import { format } from "date-fns";
import { useCloudContextUsageQuery } from "~/cloud/queries/contexts";
import type { SpectronCallOrigin, SpectronTokenKind, SpectronUsageRow } from "~/types";
import { ContextHero } from "../../../components/ContextHero";
import { EmptyState, PageError } from "../../../components/feedback";
import type { ContextViewProps } from "../../../types";

const TOKEN_KIND_COLORS: Record<SpectronTokenKind, string> = {
	input: "blue",
	output: "violet",
	embedding: "teal",
};

const ORIGIN_COLORS: Record<SpectronCallOrigin, string> = {
	public: "green",
	system: "slate",
};

function errorMessage(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}

/** Formats an ISO timestamp, falling back gracefully if it's unparseable. */
function formatDate(value?: string): string {
	if (!value) return "—";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	try {
		return format(date, "d MMM yyyy");
	} catch {
		return date.toLocaleDateString();
	}
}

export function UsageTab({ context }: ContextViewProps) {
	const org = context.organization_id;
	const ctxId = context.id;

	const usageQuery = useCloudContextUsageQuery(org, ctxId);
	const usage = usageQuery.data;

	const breakdown: SpectronUsageRow[] = usage?.breakdown ?? [];
	const tokensUsed = usage?.tokens_used ?? 0;
	const tokenLimit = usage?.token_limit ?? null;
	const percentage =
		tokenLimit && tokenLimit > 0 ? Math.min(100, (tokensUsed / tokenLimit) * 100) : null;

	const maxRowTokens = breakdown.reduce((max, row) => Math.max(max, row.tokens ?? 0), 0);

	const hasUsage = tokensUsed > 0 || breakdown.length > 0;

	return (
		<Stack gap={32}>
			<ContextHero
				kicker="Settings"
				title="Usage"
				description="Token consumption for this context's current billing period, broken down by model and call type."
				art={pictoPieChartGradient}
			/>

			{usageQuery.isError ? (
				<PageError
					title="Couldn't load usage"
					message={errorMessage(usageQuery.error)}
					onRetry={() => usageQuery.refetch()}
				/>
			) : usageQuery.isPending ? (
				<>
					<Skeleton
						h={160}
						radius="md"
					/>
					<Skeleton
						h={280}
						radius="md"
					/>
				</>
			) : !hasUsage ? (
				<EmptyState
					icon={iconChart}
					title="No usage recorded this period"
					description="Once agents start reading from and writing to this context, token usage will appear here."
				/>
			) : (
				<>
					{/* SUMMARY */}
					<Box>
						<SectionTitle
							kicker="Summary"
							order={2}
							mb="md"
						>
							This billing period
						</SectionTitle>
						<Paper
							p="xl"
							radius="md"
							withBorder
						>
							<Group
								justify="space-between"
								align="flex-start"
								wrap="wrap"
								gap="md"
							>
								<Box>
									<Text
										fz="xs"
										c="slate"
										tt="uppercase"
										style={{ letterSpacing: "0.06em" }}
									>
										Tokens used
									</Text>
									<Text
										fz={36}
										fw={700}
										c="bright"
										lh={1.1}
										className="selectable"
									>
										{tokensUsed.toLocaleString()}
									</Text>
									{tokenLimit != null && (
										<Text
											fz="sm"
											c="slate"
											mt={2}
										>
											of {tokenLimit.toLocaleString()} tokens
										</Text>
									)}
								</Box>

								{(usage?.period_start || usage?.period_end) && (
									<Group
										gap="xs"
										wrap="nowrap"
									>
										<ThemeIcon
											size={32}
											radius="md"
											variant="light"
											color="violet"
										>
											<Icon path={iconClock} />
										</ThemeIcon>
										<Box>
											<Text
												fz="xs"
												c="slate"
											>
												Billing period
											</Text>
											<Text
												fw={500}
												c="bright"
											>
												{formatDate(usage?.period_start)} –{" "}
												{formatDate(usage?.period_end)}
											</Text>
										</Box>
									</Group>
								)}
							</Group>

							{percentage != null && (
								<Box mt="lg">
									<Group
										justify="space-between"
										mb={6}
									>
										<Text
											fz="sm"
											fw={500}
											c="bright"
										>
											{percentage.toFixed(1)}% of limit
										</Text>
										<Text
											fz="sm"
											c="slate"
										>
											{tokensUsed.toLocaleString()} /{" "}
											{tokenLimit?.toLocaleString()}
										</Text>
									</Group>
									<Progress
										value={percentage}
										size="lg"
										radius="xl"
										color={percentage >= 90 ? "red" : "violet"}
									/>
								</Box>
							)}
						</Paper>
					</Box>

					{/* BREAKDOWN */}
					<Box>
						<SectionTitle
							kicker="Breakdown"
							order={2}
							mb="md"
							description="Token consumption by model, token type, and call origin."
						>
							Usage by model
						</SectionTitle>
						{breakdown.length === 0 ? (
							<EmptyState
								icon={iconChart}
								title="No per-model breakdown"
								description="A detailed breakdown will appear once usage is attributed to specific models."
							/>
						) : (
							<Paper
								radius="sm"
								withBorder
								style={{ overflow: "hidden" }}
							>
								<Table.ScrollContainer minWidth={600}>
									<Table
										striped
										verticalSpacing="sm"
										horizontalSpacing="md"
									>
										<Table.Thead>
											<Table.Tr>
												<Table.Th>Model</Table.Th>
												<Table.Th style={{ width: 120 }}>Type</Table.Th>
												<Table.Th style={{ width: 120 }}>Origin</Table.Th>
												<Table.Th
													style={{ width: 140 }}
													ta="right"
												>
													Tokens
												</Table.Th>
											</Table.Tr>
										</Table.Thead>
										<Table.Tbody>
											{breakdown.map((row, idx) => (
												<Table.Tr
													key={`${row.model}-${row.token_kind}-${row.origin}-${idx}`}
												>
													<Table.Td>
														<Box>
															<Text
																fw={500}
																c="bright"
																className="selectable"
															>
																{row.model || "—"}
															</Text>
															{maxRowTokens > 0 && (
																<Progress
																	mt={6}
																	value={
																		((row.tokens ?? 0) /
																			maxRowTokens) *
																		100
																	}
																	size="xs"
																	radius="xl"
																	color={
																		TOKEN_KIND_COLORS[
																			row.token_kind as SpectronTokenKind
																		] ?? "violet"
																	}
																/>
															)}
														</Box>
													</Table.Td>
													<Table.Td>
														<Badge
															variant="light"
															color={
																TOKEN_KIND_COLORS[
																	row.token_kind as SpectronTokenKind
																] ?? "slate"
															}
															tt="none"
														>
															{row.token_kind}
														</Badge>
													</Table.Td>
													<Table.Td>
														<Badge
															variant="dot"
															color={
																ORIGIN_COLORS[
																	row.origin as SpectronCallOrigin
																] ?? "slate"
															}
															tt="none"
														>
															{row.origin}
														</Badge>
													</Table.Td>
													<Table.Td ta="right">
														<Text
															fw={500}
															c="bright"
															className="selectable"
														>
															{(row.tokens ?? 0).toLocaleString()}
														</Text>
													</Table.Td>
												</Table.Tr>
											))}
										</Table.Tbody>
									</Table>
								</Table.ScrollContainer>
							</Paper>
						)}
					</Box>
				</>
			)}
		</Stack>
	);
}
