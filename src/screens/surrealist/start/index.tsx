import classes from "./style.module.scss";

import splashUrl from "~/assets/images/cloud-splash.webp";
import logoDarkUrl from "~/assets/images/dark/logo.webp";
import glowUrl from "~/assets/images/gradient-glow.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";

import {
	Box,
	Button,
	Center,
	Image,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
} from "@mantine/core";

import {
	iconBook,
	iconChevronRight,
	iconCloud,
	iconCog,
	iconCommunity,
	iconDiscord,
	iconPlus,
	iconQuery,
	iconSandbox,
	iconServer,
	iconSidekick,
	iconUniversity,
} from "~/util/icons";

import { useLocation } from "wouter";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { SANDBOX } from "~/constants";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { useThemeImage } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { dispatchIntent } from "~/util/intents";
import { StartAction, StartNews, StartResource } from "./content";

export function StartPage() {
	const { setActiveConnection } = useConfigStore.getState();
	const newsQuery = useLatestNewsQuery();
	const [, navigate] = useLocation();

	const newsPosts = newsQuery.data?.slice(0, 5) ?? [];

	const openSandbox = useStable(() => {
		setActiveConnection(SANDBOX);
		navigate("/query");
	});

	const openConnectionCreator = useStable(() => {
		dispatchIntent("new-connection");
	});

	const openCloud = useStable(() => {
		navigate("/cloud");
	});

	const openConnectionList = useStable(() => {
		dispatchIntent("open-connections");
	});

	const openSettings = useStable(() => {
		dispatchIntent("open-settings");
	});

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<div
				className={classes.glow}
				style={{
					backgroundImage: `url(${glowUrl})`,
				}}
			/>

			<ScrollArea
				pos="absolute"
				inset={0}
			>
				<Stack
					className={classes.content}
					justify="center"
					maw={952}
					px="xl"
					mx="auto"
					py={96}
				>
					<Stack
						align="center"
						gap={0}
					>
						<Image
							src={iconUrl}
							w={85}
						/>

						<Image
							src={logoUrl}
							w={225}
							mt="md"
						/>

						<Text
							mt="xs"
							opacity={0.4}
							c="bright"
						>
							Version {import.meta.env.VERSION}
						</Text>
					</Stack>

					<Stack
						mt={50}
						gap="lg"
					>
						<StartAction
							title="Explore Surreal Cloud"
							subtitle="Surreal Cloud redefines the database experience, offering the power and flexibility of SurrealDB without the pain of managing infrastructure."
							icon={iconCloud}
							onClick={openCloud}
							className={classes.cloudAction}
						>
							<Image
								src={splashUrl}
								className={classes.cloudImage}
							/>
						</StartAction>

						<SimpleGrid
							spacing="lg"
							cols={{
								xs: 1,
								sm: 2,
								md: 4,
							}}
						>
							<StartAction
								title="Create Connection"
								subtitle="Connect to a remote or local database"
								icon={iconPlus}
								onClick={openConnectionCreator}
							/>
							<StartAction
								title="Open the Sandbox"
								subtitle="Explore SurrealDB right inside Surrealist"
								icon={iconSandbox}
								onClick={openSandbox}
							/>
							<StartAction
								title="Manage Connections"
								subtitle="List and manage your existing connections"
								icon={iconServer}
								onClick={openConnectionList}
							/>
							<StartAction
								title="Customize Settings"
								subtitle="Configure Surrealist to your liking"
								icon={iconCog}
								onClick={openSettings}
							/>
						</SimpleGrid>
					</Stack>

					<Title
						mt="xl"
						c="bright"
					>
						Resources
					</Title>

					<SimpleGrid
						cols={{
							xs: 1,
							sm: 2,
						}}
					>
						<StartResource
							title="Documentation"
							subtitle="Learn more about Surrealist"
							icon={iconBook}
							onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealist")}
						/>
						<StartResource
							title="Community"
							subtitle="Join the discussion on Discord"
							icon={iconCommunity}
							onClick={() => adapter.openUrl("https://discord.com/invite/surrealdb")}
						/>
						<StartResource
							title="University"
							subtitle="Learn the SurrealDB fundamentals in 3 hours"
							icon={iconUniversity}
							onClick={() => adapter.openUrl("https://surrealdb.com/learn")}
						/>
						<StartResource
							title="Sidekick"
							subtitle="Get support from your personal Surreal AI assistant"
							icon={iconSidekick}
							onClick={() => navigate("/cloud/chat")}
						/>
					</SimpleGrid>

					<Title
						mt="xl"
						c="bright"
					>
						Latest news
					</Title>

					{newsQuery.isPending ? (
						<>
							<Skeleton h={144} />
							<Skeleton h={144} />
							<Skeleton h={144} />
						</>
					) : (
						<>
							{newsPosts.map((article, i) => (
								<StartNews
									key={i}
									post={article}
								/>
							))}

							<Center>
								<Button
									rightSection={<Icon path={iconChevronRight} />}
									onClick={() => dispatchIntent("open-news")}
									color="slate"
									variant="white"
									radius="xl"
									mt="xl"
								>
									Read more news
								</Button>
							</Center>
						</>
					)}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
