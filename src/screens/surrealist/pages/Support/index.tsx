import { Box, Center, Loader, ScrollArea, SimpleGrid, Stack, TextInput } from "@mantine/core";
import { adapter } from "~/adapter";
import cloudImage from "~/assets/images/icons/cloud.webp";
import communityImage from "~/assets/images/icons/community.webp";
import documentImage from "~/assets/images/icons/document.webp";
import sidekickImage from "~/assets/images/icons/sidekick.webp";
import surrealdbImage from "~/assets/images/icons/surrealdb.webp";
import tutorialsImage from "~/assets/images/icons/tutorials.webp";
import universityImage from "~/assets/images/icons/university.webp";
import { openSupportEmail } from "~/cloud/modals/account-support";
import { useSupportCollectionsQuery } from "~/cloud/queries/context";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { iconSearch } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import { ResourceTile } from "./ResourceTile";
import { SupportCollection } from "./SupportCollection";
import classes from "./style.module.scss";

export function SupportPage() {
	const { data: collections, isLoading } = useSupportCollectionsQuery();

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
					align="center"
					maw={1000}
					pb={68}
					gap="lg"
				>
					<PrimaryTitle fz={32}>Get help from SurrealDB</PrimaryTitle>
					<TextInput
						w="100%"
						size="lg"
						placeholder="Search for help"
						leftSection={<Icon path={iconSearch} />}
					/>

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
								image={tutorialsImage}
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
								name="Email us"
								description="For account or billing related issues, email us"
								image={cloudImage}
								onClick={() => openSupportEmail()}
							/>
							<ResourceTile
								name="Contact Support"
								description="Chat with our team or create a support ticket directly in Surrealist"
								image={cloudImage}
								// onClick={() => dispatchIntent("open-help", { tab: "create-ticket" })}
							/>
						</SimpleGrid>
					</Box>
				</Stack>
			</ScrollArea>
		</Box>
	);
}
