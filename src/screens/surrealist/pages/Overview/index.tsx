import classes from "./style.module.scss";

import logoDarkUrl from "~/assets/images/dark/logo.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";

import {
	ActionIcon,
	Box,
	Button,
	Center,
	Group,
	Image,
	Loader,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Transition,
} from "@mantine/core";

import {
	iconBook,
	iconChevronRight,
	iconCloud,
	iconCommunity,
	iconPlus,
	iconSidekick,
	iconUniversity,
	iconViewGrid,
	iconViewList,
} from "~/util/icons";

import { Tooltip } from "@mantine/core";
import { useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useCloudBannerQuery } from "~/cloud/queries/banner";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useSetting } from "~/hooks/config";
import { useConnectionOverview } from "~/hooks/connection";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useAbsoluteLocation, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useThemeImage } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance, Connection } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { dispatchIntent } from "~/util/intents";
import { CloudAlert } from "./banner";
import { StartCloud } from "./content/cloud";
import { StartConnection } from "./content/connection";
import { StartCreator } from "./content/creator";
import { StartInstance } from "./content/instance";
import { StartNews } from "./content/news";
import { StartResource } from "./content/resource";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OverviewPage() {
	const { setSelectedOrganization } = useCloudStore.getState();
	const [presentation, setPresentation] = useSetting("appearance", "connectionListMode");

	const newsQuery = useLatestNewsQuery();
	const bannerQuery = useCloudBannerQuery();
	const [, navigate] = useAbsoluteLocation();
	const navigateConnection = useConnectionNavigator();

	const [search, setSearch] = useState("");
	const [label, setLabel] = useState("");

	const { isPending, sandbox, userConnections, organizations } = useConnectionOverview({
		search,
		label,
	});

	const activateConnection = useStable((con: Connection) => {
		navigateConnection(con.id);
	});

	const activateInstance = useStable((instance: CloudInstance) => {
		activateConnection(resolveInstanceConnection(instance));
	});

	const authState = useCloudStore((s) => s.authState);
	const newsPosts = newsQuery.data?.slice(0, 5) ?? [];
	const gridColumns = presentation === "card" ? GRID_COLUMNS : 1;

	const createConnection = useStable(() => {
		dispatchIntent("new-connection");
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
			<TopGlow />

			<Transition
				duration={250}
				transition="fade-up"
				mounted={authState !== "unknown"}
			>
				{(style) => (
					<ScrollArea
						pos="absolute"
						inset={0}
						style={style}
					>
						<Stack
							className={classes.content}
							justify="center"
							maw={1100}
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

							{bannerQuery.data?.map((banner, i) => (
								<CloudAlert
									key={i}
									banner={banner}
								/>
							))}

							<Group mt="xl">
								<PrimaryTitle>Your connections</PrimaryTitle>
								<Spacer />
								<ActionIcon.Group>
									<ActionIcon
										c={presentation === "card" ? "bright" : "slate.3"}
										onClick={() => setPresentation("card")}
									>
										<Icon path={iconViewGrid} />
									</ActionIcon>
									<ActionIcon
										c={presentation === "row" ? "bright" : "slate.3"}
										onClick={() => setPresentation("row")}
									>
										<Icon path={iconViewList} />
									</ActionIcon>
								</ActionIcon.Group>
								{authState === "unauthenticated" && (
									<Button
										size="xs"
										variant="gradient"
										onClick={openCloudAuthentication}
										rightSection={<Icon path={iconChevronRight} />}
									>
										Sign in
									</Button>
								)}
							</Group>

							<SimpleGrid cols={gridColumns}>
								{sandbox && (
									<StartConnection
										connection={sandbox}
										presentation={presentation}
										onConnect={activateConnection}
									/>
								)}
								{userConnections.map((connection) => (
									<StartConnection
										key={connection.id}
										connection={connection}
										presentation={presentation}
										onConnect={activateConnection}
									/>
								))}
								<StartCreator
									title="New connection"
									subtitle="Connect to a local or remote instance"
									presentation={presentation}
									onCreate={createConnection}
								/>
							</SimpleGrid>

							{authState === "authenticated" &&
								organizations.map(({ info, instances }) => (
									<Fragment key={info.id}>
										<PrimaryTitle
											fz="xl"
											mt="xl"
										>
											{info.name} instances
										</PrimaryTitle>
										<SimpleGrid cols={gridColumns}>
											{instances.map((instance) => (
												<StartInstance
													key={instance.id}
													instance={instance}
													presentation={presentation}
													onConnect={activateInstance}
												/>
											))}
											<StartCreator
												title="New instance"
												subtitle="Provision a new Surreal Cloud instance"
												presentation={presentation}
												onCreate={() => {
													setSelectedOrganization(info.id);
													navigate("/provision");
												}}
											/>
										</SimpleGrid>
									</Fragment>
								))}

							{(authState === "loading" || isPending) && (
								<Center mt="xl">
									<Loader />
								</Center>
							)}

							{authState === "unauthenticated" && (
								<>
									<PrimaryTitle mt="xl">Surreal Cloud</PrimaryTitle>
									<StartCloud
										title="Explore Surreal Cloud"
										subtitle="Surreal Cloud redefines the database experience, offering the power and flexibility of SurrealDB without the pain of managing infrastructure."
										icon={iconCloud}
										onClick={openCloudAuthentication}
									/>
								</>
							)}

							<PrimaryTitle mt="xl">Resources</PrimaryTitle>

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
									onClick={() =>
										adapter.openUrl("https://surrealdb.com/docs/surrealist")
									}
								/>
								<StartResource
									title="Community"
									subtitle="Join the discussion on Discord"
									icon={iconCommunity}
									onClick={() =>
										adapter.openUrl("https://discord.com/invite/surrealdb")
									}
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
									onClick={() => navigate("/chat")}
								/>
							</SimpleGrid>

							<PrimaryTitle mt="xl">Latest news</PrimaryTitle>

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
				)}
			</Transition>
		</Box>
	);
}
