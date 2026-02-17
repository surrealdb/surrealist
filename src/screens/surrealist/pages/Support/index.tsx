import {
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useDebouncedState } from "@mantine/hooks";
import {
	Icon,
	iconPlus,
	iconSearch,
	pictoDiscord,
	pictoDocument,
	pictoGitHub,
	pictoHealthChat,
	pictoPlay,
	pictoSidekick,
	pictoSurrealDB,
	pictoUniversity,
} from "@surrealdb/ui";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useConversationsQuery, useSupportCollectionsQuery } from "~/cloud/queries/context";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsAuthenticated } from "~/hooks/cloud";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { StartCloud } from "../Overview/content/cloud";
import { ConversationCard } from "./ConversationCard";
import { ResourceTile } from "./ResourceTile";
import { SupportCollection } from "./SupportCollection";
import classes from "./style.module.scss";

export function SupportPage() {
	const isAuthenticated = useIsAuthenticated();

	const { data: collections, isLoading } = useSupportCollectionsQuery();
	const { data: chats, isLoading: isChatsLoading } = useConversationsQuery();

	const [flags] = useFeatureFlags();
	const [search, setSearch] = useDebouncedState("", 1000);

	useEffect(() => {
		if (search) {
			dispatchIntent("open-help-centre", { search });
		}
	}, [search]);

	return (
		<Box
			flex={1}
			pos="relative"
		>
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
					gap="xl"
				>
					<PrimaryTitle
						ta="center"
						fz={32}
					>
						SurrealDB Help Centre
					</PrimaryTitle>

					<TextInput
						placeholder="Search for a collection or article"
						leftSection={<Icon path={iconSearch} />}
						flex={1}
						size="lg"
						onChange={(e) => setSearch(e.target.value)}
					/>

					{isChatsLoading && (
						<Center my="xl">
							<Loader />
						</Center>
					)}

					{flags.support_tickets && (
						<>
							{isAuthenticated && chats && chats.length !== 0 && !isChatsLoading && (
								<Paper p="xl">
									<Group>
										<Text
											c="bright"
											fw={600}
											fz={20}
											lh={1}
										>
											Recent support tickets
										</Text>
										<Spacer />
										<Button
											variant="light"
											size="xs"
											color="obsidian"
											onClick={() => navigate("/support/requests")}
										>
											View All
										</Button>

										<Button
											variant="gradient"
											size="xs"
											rightSection={<Icon path={iconPlus} />}
											onClick={() => {
												dispatchIntent("create-message", {
													type: "ticket",
												});
											}}
										>
											Create new ticket
										</Button>
									</Group>

									<Stack
										ml="-xs"
										mt="md"
										gap={0}
									>
										{!isChatsLoading &&
											chats
												?.sort((a, b) => b.updated_at - a.updated_at)
												.slice(0, 3)
												.map((chat) => (
													<Paper
														p="xs"
														key={chat.id}
														withBorder={false}
														style={{
															cursor: "pointer",
														}}
														className={classes.messageItem}
														onClick={() =>
															navigate(
																`/support/conversations/${chat.id}`,
															)
														}
													>
														<ConversationCard conversation={chat} />
													</Paper>
												))}
										{isChatsLoading && (
											<Center my="xl">
												<Loader />
											</Center>
										)}
									</Stack>
								</Paper>
							)}

							{!isChatsLoading &&
								(!isAuthenticated || !chats || chats.length === 0) && (
									<StartCloud
										action={isAuthenticated ? "Explore plans" : "Sign in"}
										image={pictoHealthChat}
										onClick={() => {
											if (isAuthenticated) {
												navigate(
													"/organisations?destination=support-plans",
												);
											} else {
												openCloudAuthentication();
											}
										}}
									>
										<Group>
											<PrimaryTitle>Need expert answers fast?</PrimaryTitle>
											<Text>
												Upgrade your organisation's Support Plan to get
												expedited support from the SurrealDB team, so you're
												never left stramded when it matters the most.
											</Text>
										</Group>
									</StartCloud>
								)}
						</>
					)}

					<Box
						mt="xl"
						w="100%"
						className={classes.content}
					>
						<PrimaryTitle fz={22}>Support Collections</PrimaryTitle>
						{isLoading && (
							<Center my="xl">
								<Loader />
							</Center>
						)}

						{!isLoading && (
							<SimpleGrid
								mt="md"
								cols={{ base: 1, md: 2 }}
								spacing="xl"
								mx="auto"
							>
								{collections
									?.sort((a, b) => a.order - b.order)
									.map((collection) => (
										<SupportCollection
											key={collection.id}
											collection={collection}
										/>
									))}
							</SimpleGrid>
						)}
					</Box>

					<Box
						mt="xl"
						w="100%"
						className={classes.content}
					>
						<PrimaryTitle fz={22}>Helpful Resources</PrimaryTitle>

						<SimpleGrid
							mt="md"
							cols={{ base: 1, md: 2 }}
							spacing="md"
							mx="auto"
						>
							<ResourceTile
								name="SurrealDB Documentation"
								description="Learn everything there is to know about all SurrealDB products"
								image={pictoSurrealDB}
								onClick={() => adapter.openUrl("https://surrealdb.com/docs")}
							/>
							<ResourceTile
								name="SurrealDB YouTube"
								description="Learn about SurrealDB through live streams and video tutorials"
								image={pictoPlay}
								onClick={() =>
									adapter.openUrl("https://www.youtube.com/@SurrealDB")
								}
							/>
							<ResourceTile
								name="University: Fundamentals"
								description="Learn the fundamentals of SurrealDB in as little as 3 hours"
								image={pictoUniversity}
								onClick={() =>
									adapter.openUrl("https://surrealdb.com/learn/fundamentals")
								}
							/>
							<ResourceTile
								name="University: Book"
								description="Become a SurrealQL expert through Aeon's Surreal Renaissance"
								image={pictoDocument}
								onClick={() => adapter.openUrl("https://surrealdb.com/learn/book")}
							/>
						</SimpleGrid>
					</Box>

					<Box
						mt="xl"
						w="100%"
						className={classes.content}
					>
						<PrimaryTitle fz={22}>Reach Out</PrimaryTitle>

						<SimpleGrid
							mt="md"
							cols={{ base: 1, md: 2 }}
							spacing="md"
							mx="auto"
						>
							<ResourceTile
								name="Discord Community"
								description="Join our active community for ideas, discussions, and support"
								image={pictoDiscord}
								onClick={() =>
									adapter.openUrl("https://discord.com/invite/dc4JNWrrMc")
								}
							/>
							<ResourceTile
								name="Sidekick"
								description="Chat with Sidekick for the quickest answers to your questions"
								image={pictoSidekick}
								onClick={() => dispatchIntent("open-sidekick")}
							/>
							<ResourceTile
								name="GitHub"
								description="Report issues or submit feature requests"
								image={pictoGitHub}
								onClick={() => adapter.openUrl("https://github.com/surrealdb")}
							/>
							{flags.support_tickets && (
								<ResourceTile
									name="Account Support"
									description="Contact us for account and billing issues"
									image={pictoHealthChat}
									onClick={() =>
										dispatchIntent("create-message", {
											type: "conversation",
											conversationType: "general",
											subject: "Account / billing enquiry",
										})
									}
								/>
							)}
							{!flags.support_tickets && (
								<ResourceTile
									name="Contact Support"
									description="For account and billing issues, email support"
									image={pictoHealthChat}
									onClick={() => adapter.openUrl("mailto:support@surrealdb.com")}
								/>
							)}
						</SimpleGrid>
					</Box>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
