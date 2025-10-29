import { Box, Button, Center, Group, Loader, Paper, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { adapter } from "~/adapter";
import { useCloudOrganizationTicketsQuery } from "~/cloud/queries/context";
import { useActiveSupportPlanQuery } from "~/cloud/queries/support";
import { Icon } from "~/components/Icon";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Section } from "~/components/Section";
import { useIsLight } from "~/hooks/theme";
import { iconOpen } from "~/util/icons";
import { TicketCard } from "../../Support/TicketCard";
import { OrganizationTabProps } from "../types";

export function OrganizationSupportTab({ organization }: OrganizationTabProps) {
	const pagination = usePagination();

	const { data: activeSupportPlan } = useActiveSupportPlanQuery(organization.id);
	const { data: tickets, isLoading: areTicketsLoading } = useCloudOrganizationTicketsQuery(
		organization.id,
	);

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
				title="Recent support requests"
				description="The most recent support requests for this organisation"
			>
				<Stack>
					{areTicketsLoading && (
						<Center>
							<Loader />
						</Center>
					)}
					{!areTicketsLoading && pageSlice && pageSlice.length > 0 && (
						<Paper p="lg">
							{pageSlice
								?.sort((a, b) => b.updated_at - a.updated_at)
								.slice(0, 3)
								.map((ticket) => (
									<TicketCard
										key={ticket.id}
										ticket={ticket}
									/>
								))}
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
