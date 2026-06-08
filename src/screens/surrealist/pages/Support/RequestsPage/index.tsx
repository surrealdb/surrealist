import { Box, Button, Center, Group, Loader } from "@mantine/core";
import { Icon, iconPlus } from "@surrealdb/ui";
import { useConversationsQuery } from "~/cloud/queries/context";
import { CloudGuard } from "~/components/CloudGuard";
import { ConversationTable } from "~/components/ConversationTable";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { supportBreadcrumbs } from "~/util/breadcrumbs";
import { dispatchIntent } from "~/util/intents";
import { PageContainer } from "../../../components/PageContainer";

export function RequestsPage() {
	const { data: requests, isLoading } = useConversationsQuery();

	return (
		<>
			<PageBreadcrumbs items={supportBreadcrumbs({ label: "Requests" })} />
			<CloudGuard>
				<PageContainer>
					{isLoading && (
						<Center my="xl">
							<Loader />
						</Center>
					)}

					<Box>
						<Group>
							<PrimaryTitle fz={32}>Support tickets</PrimaryTitle>
							<Spacer />

							<Button
								variant="gradient"
								size="xs"
								rightSection={<Icon path={iconPlus} />}
								onClick={() => {
									dispatchIntent("create-message", { type: "ticket" });
								}}
							>
								Create new ticket
							</Button>
						</Group>
					</Box>

					<ConversationTable
						conversations={requests ?? []}
						isLoading={isLoading}
						defaultSortMode="updated_latest"
						defaultType="open"
					/>
				</PageContainer>
			</CloudGuard>
		</>
	);
}
