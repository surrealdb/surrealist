import { Box, Button, Center, Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { adapter } from "~/adapter";
import chatImage from "~/assets/images/icons/chat.webp";
import { useCloudOrganizationTicketsQuery } from "~/cloud/queries/context";
import { useActiveSupportPlanQuery } from "~/cloud/queries/support";
import { Icon } from "~/components/Icon";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useIsLight } from "~/hooks/theme";
import { iconOpen, iconPlus } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { StartCloud } from "../../Overview/content/cloud";
import { TicketCard } from "../../Support/TicketCard";
import { OrganizationTabProps } from "../types";

export function OrganizationSupportTab({ organization }: OrganizationTabProps) {
	const pagination = usePagination();

	const { data: activeSupportPlan } = useActiveSupportPlanQuery(organization.id);
	const { data: tickets, isLoading: areTicketsLoading } = useCloudOrganizationTicketsQuery(
		organization.id,
	);

	const hasSupportPlan = activeSupportPlan?.support_plan !== undefined;
	const startAt = (pagination.currentPage - 1) * pagination.pageSize;
	const pageSlice = tickets?.slice(startAt, startAt + pagination.pageSize) ?? [];

	useEffect(() => {
		pagination.setTotal(tickets?.length || 0);
	}, [pagination.setTotal, tickets]);

	return (
		<Stack>
			<Section
				title="Support Plan"
				description="The support plan for this organisation"
			>
				<SupportPlan
					name={activeSupportPlan?.support_plan.name ?? "Community"}
					description={
						activeSupportPlan?.support_plan.description ??
						"Receive help from community members on Discord and GitHub"
					}
				/>
			</Section>
			<Section
				title="Support Tickets"
				description="All support tickets for this organisation"
				rightSection={
					hasSupportPlan && (
						<Button
							size="xs"
							variant="gradient"
							rightSection={<Icon path={iconPlus} />}
							onClick={() => {
								dispatchIntent("create-message", {
									type: "ticket",
									organisation: organization.id,
								});
							}}
						>
							New ticket
						</Button>
					)
				}
			>
				{hasSupportPlan && (
					<>
						<Stack>
							{areTicketsLoading && (
								<Center>
									<Loader />
								</Center>
							)}
							{!areTicketsLoading && pageSlice && pageSlice.length > 0 && (
								<Paper p="lg">
									<Stack>
										{pageSlice
											?.sort((a, b) => b.updated_at - a.updated_at)
											.slice(0, 3)
											.map((ticket) => (
												<Box
													key={ticket.id}
													style={{
														cursor: "pointer",
													}}
													onClick={() =>
														navigate(
															`/support/conversations/${ticket.id}`,
														)
													}
												>
													<TicketCard ticket={ticket} />
												</Box>
											))}
									</Stack>
								</Paper>
							)}
							{!areTicketsLoading && (!pageSlice || pageSlice.length === 0) && (
								<Center>
									<Text>No support requests found</Text>
								</Center>
							)}
						</Stack>

						<Group
							justify="center"
							mt="xl"
						>
							<Pagination store={pagination} />
						</Group>
					</>
				)}
				{!hasSupportPlan && (
					<StartCloud
						action="View plans"
						image={chatImage}
						onClick={() => {
							adapter.openUrl("https://surrealdb.com/pricing");
						}}
					>
						<Group>
							<PrimaryTitle>Support Plan required</PrimaryTitle>
							<Text>
								Upgrade to a Support Plan to get expedited support directly from the
								SurrealDB team, so you're never left hanging when it matters the
								most.
							</Text>
						</Group>
					</StartCloud>
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
				<Button
					variant="gradient"
					onClick={() => {
						adapter.openUrl("https://surrealdb.com/pricing");
					}}
					rightSection={
						<Icon
							path={iconOpen}
							size="md"
						/>
					}
				>
					View plans
				</Button>
			</Group>
		</Paper>
	);
}
