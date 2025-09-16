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
import { useEffect } from "react";
import { navigate } from "wouter/use-browser-location";
import { adapter } from "~/adapter";
import chatImage from "~/assets/images/icons/chat.webp";
import communityImage from "~/assets/images/icons/community.webp";
import documentImage from "~/assets/images/icons/document.webp";
import githubImage from "~/assets/images/icons/github.webp";
import playImage from "~/assets/images/icons/play.webp";
import sidekickImage from "~/assets/images/icons/sidekick.webp";
import surrealdbImage from "~/assets/images/icons/surrealdb.webp";
import universityImage from "~/assets/images/icons/university.webp";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useConversationsQuery, useSupportCollectionsQuery } from "~/cloud/queries/context";
import { Icon } from "~/components/Icon";
import { ListMenu } from "~/components/ListMenu";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { SUPPORT_REQUEST_TYPES } from "~/constants";
import { useIsAuthenticated } from "~/hooks/cloud";
import { iconPlus, iconSearch } from "~/util/icons";
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

	const [search, setSearch] = useDebouncedState("", 1000);

	useEffect(() => {
		if (search) {
			dispatchIntent("open-help-center", { search });
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
						SurrealDB Help Center
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

					{isAuthenticated && chats && chats.length !== 0 && !isChatsLoading && (
						<Paper p="xl">
							<Group>
								<Text
									c="bright"
									fw={600}
									fz={20}
									lh={1}
								>
									Recent support requests
								</Text>
								<Spacer />
								<Button
									variant="light"
									size="xs"
									color="slate"
									onClick={() => navigate("/support/requests")}
								>
									View All
								</Button>
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
												variant="transparent"
												withBorder={false}
												style={{
													cursor: "pointer",
												}}
												className={classes.messageItem}
												onClick={() =>
													navigate(`/support/conversations/${chat.id}`)
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

					{/* TODO: Check support plan */}
					{isAuthenticated && (!chats || chats.length === 0) && !isChatsLoading && (
						<StartCloud
							action="Submit a ticket"
							image={chatImage}
							onClick={() => {
								dispatchIntent("create-message", { type: "ticket" });
							}}
						>
							<Group>
								<PrimaryTitle>No recent support requests</PrimaryTitle>
								<Text>
									Since you have purchased a Support Plan, you can create a
									support ticket to get expedited support directly from the
									SurrealDB team.
								</Text>
							</Group>
						</StartCloud>
					)}

					{/* TODO: Check support plan */}
					{!isAuthenticated && !isChatsLoading && (
						<StartCloud
							action="Learn more"
							image={chatImage}
							onClick={() => {
								openCloudAuthentication();
							}}
						>
							<Group>
								<PrimaryTitle>Need expert answers fast?</PrimaryTitle>
								<Text>
									Upgrade to a Support Plan to get expedited support directly from
									the SurrealDB team, so you're never left hanging when it matters
									the most.
								</Text>
							</Group>
						</StartCloud>
					)}

					<Box
						mt="xl"
						w="100%"
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
					>
						<PrimaryTitle fz={22}>Helpful Resources</PrimaryTitle>

						<SimpleGrid
							mt="md"
							cols={{ base: 1, md: 2 }}
							spacing="xl"
							mx="auto"
						>
							<ResourceTile
								name="SurrealDB Documentation"
								description="Learn everything there is to know about all SurrealDB products"
								image={surrealdbImage}
								onClick={() => adapter.openUrl("https://surrealdb.com/docs")}
							/>
							<ResourceTile
								name="SurrealDB YouTube"
								description="Learn about SurrealDB through live streams and video tutorials"
								image={playImage}
								onClick={() =>
									adapter.openUrl("https://www.youtube.com/@SurrealDB")
								}
							/>
							<ResourceTile
								name="University: Fundamentals"
								description="Learn the fundamentals of SurrealDB in as little as 3 hours"
								image={universityImage}
								onClick={() =>
									adapter.openUrl("https://surrealdb.com/learn/fundamentals")
								}
							/>
							<ResourceTile
								name="University: Book"
								description="Become a SurrealQL expert through Aeon's Surreal Renaissance"
								image={documentImage}
								onClick={() => adapter.openUrl("https://surrealdb.com/learn/book")}
							/>
						</SimpleGrid>
					</Box>

					<Box
						mt="xl"
						w="100%"
					>
						<PrimaryTitle fz={22}>Reach Out</PrimaryTitle>

						<SimpleGrid
							mt="md"
							cols={{ base: 1, md: 2 }}
							spacing="xl"
							mx="auto"
						>
							<ResourceTile
								name="Discord Community"
								description="Join our active community for ideas, discussions, and support"
								image={communityImage}
								onClick={() =>
									adapter.openUrl("https://discord.com/invite/dc4JNWrrMc")
								}
							/>
							<ResourceTile
								name="Sidekick"
								description="Chat with Sidekick for the quickest answers to your questions"
								image={sidekickImage}
								onClick={() => dispatchIntent("open-sidekick")}
							/>
							<ResourceTile
								name="GitHub"
								description="Report issues or submit feature requests"
								image={githubImage}
								onClick={() => adapter.openUrl("https://github.com/surrealdb")}
							/>
							<ResourceTile
								name="Contact Support"
								description="Chat with our team or create a support ticket directly in Surrealist"
								image={chatImage}
								onClick={() => navigate("/support/requests")}
							/>
						</SimpleGrid>
					</Box>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
