import { Box, Button, Center, Group, Loader, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { Icon } from "@surrealdb/ui";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { useConversationsQuery } from "~/cloud/queries/context";
import { AuthGuard } from "~/components/AuthGuard";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { iconPlus } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { ConversationCard } from "../ConversationCard";
import classes from "../style.module.scss";

export function RequestsPage() {
	const pagination = usePagination();
	const { data: requests, isLoading } = useConversationsQuery();

	const startAt = (pagination.currentPage - 1) * pagination.pageSize;
	const pageSlice = requests?.slice(startAt, startAt + pagination.pageSize) ?? [];

	useEffect(() => {
		pagination.setTotal(requests?.length || 0);
	}, [pagination.setTotal, requests]);

	return (
		<AuthGuard>
			<Box
				flex={1}
				pos="relative"
			>
				{isLoading && (
					<Center
						w="100%"
						h="100%"
						flex={1}
					>
						<Loader />
					</Center>
				)}

				<ScrollArea
					pos="absolute"
					scrollbars="y"
					type="scroll"
					inset={0}
					className={classes.scrollArea}
					mt={18}
				>
					<Stack
						px="xl"
						h="100%"
						mx="auto"
						maw={1000}
						pb={68}
					>
						<Box>
							<PageBreadcrumbs
								items={[
									{ label: "Surrealist", href: "/overview" },
									{ label: "Support", href: "/support" },
									{ label: "Requests" },
								]}
							/>
							<Group>
								<PrimaryTitle
									fz={32}
									mt="sm"
								>
									Support tickets
								</PrimaryTitle>
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

						{!isLoading && requests && requests.length > 0 && (
							<>
								<Paper p="lg">
									<Stack gap={5}>
										{pageSlice
											.sort((a, b) => b.updated_at - a.updated_at)
											.map((request) => (
												<Box
													p="xs"
													key={request.id}
													style={{
														cursor: "pointer",
													}}
													className={classes.messageItem}
													onClick={() =>
														navigate(
															`/support/conversations/${request.id}`,
														)
													}
												>
													<ConversationCard conversation={request} />
												</Box>
											))}
									</Stack>
								</Paper>

								<Group
									justify="center"
									py="xl"
								>
									<Pagination store={pagination} />
								</Group>
							</>
						)}

						{!isLoading && (!requests || requests.length === 0) && (
							<Center
								w="100%"
								h="100%"
								flex={1}
							>
								<Stack
									gap={0}
									align="center"
								>
									<PrimaryTitle>No tickets found</PrimaryTitle>
									<Text>You have no current or previous support tickets</Text>
								</Stack>
							</Center>
						)}
					</Stack>
				</ScrollArea>
			</Box>
		</AuthGuard>
	);
}
