import {
	Box,
	Button,
	Center,
	Group,
	Loader,
	Paper,
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
	pictoBankGradient,
	pictoBookGradient,
	pictoDiscordGradient,
	pictoGitHubGradient,
	pictoHandsOnGradient,
	pictoHealthChatGradient,
	pictoPlayGradient,
	pictoRedditGradient,
	pictoSidekickGradient,
	pictoSpectronGradient,
	pictoSurrealDBGradient,
	pictoSurrealistGradient,
	pictoUniversityGradient,
} from "@surrealdb/ui";
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { adapter } from "~/adapter";
import { useConversationsQuery, useSupportCollectionsQuery } from "~/cloud/queries/context";
import { ConversationTable } from "~/components/ConversationTable";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { openSelectOrganizationModal } from "~/modals/select-organization";
import { useAuthentication } from "~/providers/Auth";
import { useFeatureFlags } from "~/util/feature-flags";
import { dispatchIntent } from "~/util/intents";
import { PageContainer } from "../../components/PageContainer";
import { StartCloud } from "../Overview/content/cloud";
import { ResourceTile } from "./ResourceTile";
import { SupportCollection } from "./SupportCollection";
import classes from "./style.module.scss";

export function SupportPage() {
	const { signIn, isAuthenticated } = useAuthentication();

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
		<>
			<PageBreadcrumbs items={[{ label: "Support" }]} />
			<PageContainer>
				<Stack gap="xl">
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
						size="md"
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
								<Paper p="lg">
									<Group p="sm">
										<Text
											c="bright"
											fw={600}
											fz={20}
											lh={1}
										>
											Open support tickets
										</Text>
										<Spacer />
										<Button
											variant="light"
											size="xs"
											color="obsidian"
											onClick={() => navigate("/support/requests")}
										>
											View all tickets
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

									<ConversationTable
										conversations={chats.sort(
											(a, b) => b.updated_at - a.updated_at,
										)}
										defaultSortMode="updated_latest"
										defaultType="open"
										withHeader={false}
									/>
								</Paper>
							)}

							{!isChatsLoading &&
								(!isAuthenticated || !chats || chats.length === 0) && (
									<StartCloud
										action={isAuthenticated ? "Explore plans" : "Sign in"}
										image={pictoHealthChatGradient}
										onClick={() => {
											if (isAuthenticated) {
												openSelectOrganizationModal({
													description:
														"Select an organisation to view available support plans.",
													action: "View plans",
													onSelect: (org) => {
														navigate(`/o/${org.id}/support-plans`);
													},
												});
											} else {
												signIn();
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
								cols={{ base: 1, sm: 2, lg: 3 }}
								spacing="md"
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
							cols={{ base: 1, sm: 2, lg: 3 }}
							spacing="md"
							mx="auto"
						>
							<ResourceTile
								name="SurrealDB Documentation"
								description="Learn everything you need to know about the SurrealDB database, query language, and tooling"
								image={pictoSurrealDBGradient}
								onClick={() => adapter.openUrl("https://surrealdb.com/docs")}
							/>
							<ResourceTile
								name="Spectron Documentation"
								description="Learn how to use Spectron - persistent agent memory built on knowledge graphs"
								image={pictoSpectronGradient}
								onClick={() =>
									adapter.openUrl("https://surrealdb.com/docs/spectron")
								}
							/>
							<ResourceTile
								name="Surrealist Documentation"
								description="Learn all of the tips and tricks for using Surrealist to its full potential"
								image={pictoSurrealistGradient}
								onClick={() =>
									adapter.openUrl("https://surrealdb.com/docs/explore/surrealist")
								}
							/>
							<ResourceTile
								name="SurrealDB YouTube"
								description="Learn more by watching our video tutorials and attending live events on YouTube"
								image={pictoPlayGradient}
								onClick={() =>
									adapter.openUrl("https://www.youtube.com/@SurrealDB")
								}
							/>
							<ResourceTile
								name="University: Fundamentals"
								description="Learn the fundamentals of SurrealDB in as little as 3 hours through our interactive course"
								image={pictoUniversityGradient}
								onClick={() =>
									adapter.openUrl("https://surrealdb.com/learn/fundamentals")
								}
							/>
							<ResourceTile
								name="University: Book"
								description="Become a SurrealQL expert through Aeon's Surreal Renaissance"
								image={pictoBookGradient}
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
							cols={{ base: 1, sm: 2, lg: 3 }}
							spacing="md"
							mx="auto"
						>
							<ResourceTile
								name="Discord Community"
								description="Join us on Discord to discuss SurrealDB, showcase your projects, and get help from the community"
								image={pictoDiscordGradient}
								onClick={() =>
									adapter.openUrl("https://discord.com/invite/dc4JNWrrMc")
								}
							/>
							<ResourceTile
								name="Reddit Community"
								description="Join us on Reddit to discuss SurrealDB and connect with other SurrealDB users"
								image={pictoRedditGradient}
								onClick={() =>
									adapter.openUrl("https://www.reddit.com/r/surrealdb/")
								}
							/>
							<ResourceTile
								name="GitHub"
								description="Report issues, submit feature requests, or contribute to our projects on GitHub"
								image={pictoGitHubGradient}
								onClick={() => adapter.openUrl("https://github.com/surrealdb")}
							/>
							<ResourceTile
								name="Sidekick"
								description="Chat with Sidekick to get quick and personalized answers to your questions"
								image={pictoSidekickGradient}
								onClick={() => dispatchIntent("open-sidekick")}
							/>
							<ResourceTile
								name="Contact: Account Support"
								description="Have an account or billing question and need to speak with us? Click here to start a conversation"
								image={pictoHandsOnGradient}
								onClick={() =>
									dispatchIntent("create-message", {
										type: "conversation",
										conversationType: "general",
										subject: "Account / billing enquiry",
									})
								}
							/>
							<ResourceTile
								name="Contact: Sales Enquiry"
								description="Interested in learning how SurrealDB can benefit your business? Click here to start chatting"
								image={pictoBankGradient}
								onClick={() =>
									dispatchIntent("create-message", {
										type: "conversation",
										conversationType: "sales-enquiry",
										subject: "Sales enquiry",
									})
								}
							/>
						</SimpleGrid>
					</Box>
				</Stack>
			</PageContainer>
		</>
	);
}
