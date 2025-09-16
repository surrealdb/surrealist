import { Box, Button, Center, Group, Loader, Paper, ScrollArea, Stack, Text } from "@mantine/core";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { useConversationsQuery } from "~/cloud/queries/context";
import { AuthGuard } from "~/components/AuthGuard";
import { Icon } from "~/components/Icon";
import { ListMenu } from "~/components/ListMenu";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { Pagination } from "~/components/Pagination";
import { usePagination } from "~/components/Pagination/hook";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { SUPPORT_REQUEST_TYPES } from "~/constants";
import { iconArrowLeft, iconPlus } from "~/util/icons";
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
							<PrimaryTitle>No requests found</PrimaryTitle>
							<Text>You have no current or previous support requests</Text>
							<Button
								mt="xl"
								size="sm"
								variant="gradient"
								leftSection={<Icon path={iconArrowLeft} />}
								onClick={() => navigate("/support")}
							>
								Back to Support
							</Button>
						</Stack>
					</Center>
				)}

				{!isLoading && requests && requests.length > 0 && (
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
										Support requests
									</PrimaryTitle>
									<Spacer />

									<ListMenu
										data={SUPPORT_REQUEST_TYPES}
										value={undefined}
										onChange={(type) => {
											dispatchIntent("create-message", { type });
										}}
									>
										<Button
											variant="gradient"
											size="xs"
											rightSection={<Icon path={iconPlus} />}
										>
											Raise new request
										</Button>
									</ListMenu>
								</Group>
							</Box>

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
													navigate(`/support/conversations/${request.id}`)
												}
											>
												<ConversationCard conversation={request} />
											</Box>
										))}
								</Stack>
							</Paper>

							<Group
								justify="center"
								mt="xl"
							>
								<Pagination store={pagination} />
							</Group>
						</Stack>
					</ScrollArea>
				)}
			</Box>
		</AuthGuard>
	);
}
