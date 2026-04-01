import {
	Box,
	Button,
	Group,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Transition,
} from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconPlus,
	pictoCloud,
	pictoHandsOn,
	pictoSidekick,
	pictoSurrealDB,
	pictoUniversity,
} from "@surrealdb/ui";
import { useMemo } from "react";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { isOrganisationTerminated } from "~/cloud/helpers";
import { useCloudBannerQuery } from "~/cloud/queries/banner";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useConnectionList } from "~/hooks/connection";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { useConfigStore } from "~/stores/config";
import { Connection } from "~/types";
import { dispatchIntent } from "~/util/intents";
import { CloudAlert } from "./banner";
import { StartBlog } from "./content/blog";
import { StartCloud } from "./content/cloud";
import { StartConnection } from "./content/connection";
import { OrganizationTile } from "./content/organization";
import { StartResource } from "./content/resource";
import classes from "./style.module.scss";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OverviewPage() {
	const showCloud = useIsCloudEnabled();

	const newsQuery = useLatestNewsQuery();
	const bannerQuery = useCloudBannerQuery();
	const navigateConnection = useConnectionNavigator();

	const connections = useConnectionList();
	const sandbox = useConfigStore((s) => s.sandbox);

	const userConnections = useMemo(
		() => connections.filter((c) => !c.authentication.cloudInstance),
		[connections],
	);

	const activateConnection = useStable((con: Connection) => {
		navigateConnection(con.id);
	});

	const authState = useCloudStore((s) => s.authState);
	const dismissedBanners = useConfigStore((s) => s.dismissedBanners);
	const newsPosts = newsQuery.data?.slice(0, 2) ?? [];

	const orgsQuery = useCloudOrganizationsQuery();
	const activeOrgs = orgsQuery.data?.filter((org) => !isOrganisationTerminated(org)) ?? [];
	const isOrgsLoading =
		authState === "loading" || (authState === "authenticated" && orgsQuery.isPending);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<Transition
				duration={250}
				transition="fade-up"
				mounted={authState !== "unknown"}
			>
				{(style) => (
					<ScrollArea
						style={style}
						pos="absolute"
						scrollbars="y"
						type="scroll"
						inset={0}
						mt={18}
					>
						<Stack
							px="xl"
							mx="auto"
							maw={1200}
							pb={68}
							className={classes.content}
						>
							<Box>
								<PageBreadcrumbs
									items={[{ label: "Surrealist", href: "/overview" }]}
								/>
								<PrimaryTitle
									mt="sm"
									fz={32}
								>
									Overview
								</PrimaryTitle>
							</Box>

							{bannerQuery.isSuccess &&
								bannerQuery.data.length > 0 &&
								(() => {
									const visibleBanners = bannerQuery.data.filter(
										(b) => !dismissedBanners.includes(b.timestamp),
									);

									return (
										visibleBanners.length > 0 && (
											<Box mb={36}>
												{visibleBanners.map((banner) => (
													<CloudAlert
														key={banner.timestamp}
														banner={banner}
													/>
												))}
											</Box>
										)
									);
								})()}

							{showCloud && (
								<>
									<Group>
										<PrimaryTitle fz={22}>Organisations</PrimaryTitle>
										<Spacer />
										<Link href="/organisations/create">
											<Button
												size="xs"
												variant="gradient"
												rightSection={<Icon path={iconPlus} />}
											>
												Create organisation
											</Button>
										</Link>
									</Group>

									{isOrgsLoading && (
										<SimpleGrid
											cols={GRID_COLUMNS}
											mt="sm"
										>
											<Skeleton h={112} />
										</SimpleGrid>
									)}

									{authState === "unauthenticated" && (
										<StartCloud
											mt="sm"
											action="Sign in"
											image={pictoCloud}
											onClick={openCloudAuthentication}
										>
											<PrimaryTitle>
												Get started with SurrealDB Cloud
											</PrimaryTitle>
											<Text>
												Sign in to deploy managed instances, collaborate
												with your team, and manage your infrastructure from
												one place.
											</Text>
										</StartCloud>
									)}

									{activeOrgs.length > 0 && (
										<SimpleGrid
											cols={GRID_COLUMNS}
											mt="sm"
										>
											{activeOrgs.map((org) => (
												<OrganizationTile
													key={org.id}
													organization={org}
												/>
											))}
										</SimpleGrid>
									)}
								</>
							)}

							<Group mt={showCloud ? 36 : 0}>
								<PrimaryTitle fz={22}>Connections</PrimaryTitle>

								<Spacer />

								<Link href="/connections/create">
									<Button
										size="xs"
										variant="gradient"
										rightSection={<Icon path={iconPlus} />}
									>
										Create connection
									</Button>
								</Link>
							</Group>

							<SimpleGrid
								cols={GRID_COLUMNS}
								mt="sm"
							>
								<StartConnection
									connection={sandbox}
									onConnect={activateConnection}
								/>
								{userConnections.map((connection) => (
									<StartConnection
										key={connection.id}
										connection={connection}
										onConnect={activateConnection}
									/>
								))}
							</SimpleGrid>

							<PrimaryTitle
								mt={36}
								fz={22}
							>
								Resources
							</PrimaryTitle>

							<SimpleGrid
								cols={{
									xs: 1,
									sm: 2,
								}}
							>
								<StartResource
									title="Documentation"
									subtitle="Explore the SurrealDB documentation"
									image={pictoSurrealDB}
									onClick={() =>
										adapter.openUrl("https://surrealdb.com/docs/surrealdb")
									}
								/>
								<StartResource
									title="Community"
									subtitle="Join the discussion on Discord"
									image={pictoHandsOn}
									onClick={() =>
										adapter.openUrl("https://discord.com/invite/surrealdb")
									}
								/>
								<StartResource
									title="University"
									subtitle="Learn the SurrealDB fundamentals in 3 hours"
									image={pictoUniversity}
									onClick={() => adapter.openUrl("https://surrealdb.com/learn")}
								/>
								<StartResource
									title="Sidekick"
									subtitle="Get support from your personal Surreal AI assistant"
									image={pictoSidekick}
									onClick={() => dispatchIntent("open-sidekick")}
								/>
							</SimpleGrid>

							<Group mt={36}>
								<PrimaryTitle
									fz={22}
									flex={1}
								>
									Featured articles
								</PrimaryTitle>
								<Button
									rightSection={<Icon path={iconArrowUpRight} />}
									onClick={() => dispatchIntent("open-news")}
									color="obsidian"
									variant="subtle"
								>
									Read all articles
								</Button>
							</Group>

							<SimpleGrid
								cols={{
									xs: 1,
									sm: 2,
								}}
							>
								{newsPosts.map((article, i) => (
									<StartBlog
										key={i}
										post={article}
									/>
								))}
							</SimpleGrid>
						</Stack>
					</ScrollArea>
				)}
			</Transition>
		</Box>
	);
}
