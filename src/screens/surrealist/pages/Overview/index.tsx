import { Box, Button, Group, SimpleGrid, Skeleton, Text, Transition } from "@mantine/core";
import {
	Icon,
	iconArrowUpRight,
	iconPlus,
	pictoCloudGradient,
	pictoHandsOnGradient,
	pictoSidekickGradient,
	pictoSurrealDBGradient,
	pictoUniversityGradient,
	SectionTitle,
} from "@surrealdb/ui";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { isOrganisationTerminated } from "~/cloud/helpers";
import { useCloudBannerQuery } from "~/cloud/queries/banner";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { SearchInput } from "~/components/Inputs/search";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { filterConnections, useConnectionList } from "~/hooks/connection";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useAuthentication } from "~/providers/Auth";
import { useConfigStore } from "~/stores/config";
import { Connection } from "~/types";
import { fuzzyMatch } from "~/util/helpers";
import { dispatchIntent } from "~/util/intents";
import { PageContainer } from "../../components/PageContainer";
import { CloudAlert } from "./banner";
import { StartBlog } from "./content/blog";
import { StartCloud } from "./content/cloud";
import { StartConnection } from "./content/connection";
import { OrganizationTile } from "./content/organization";
import { StartResource } from "./content/resource";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OverviewPage() {
	const showCloud = useIsCloudEnabled();
	const { signIn, isAuthenticated, isLoading: isAuthLoading } = useAuthentication();

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

	const dismissedBanners = useConfigStore((s) => s.dismissedBanners);
	const newsPosts = newsQuery.data?.slice(0, 2) ?? [];

	const [orgSearch, setOrgSearch] = useState("");
	const [connectionSearch, setConnectionSearch] = useState("");

	const orgsQuery = useCloudOrganizationsQuery();
	const activeOrgs = orgsQuery.data?.filter((org) => !isOrganisationTerminated(org)) ?? [];
	const isOrgsLoading = isAuthenticated && orgsQuery.isPending;

	const filteredOrgs = useMemo(() => {
		if (!orgSearch) {
			return activeOrgs;
		}

		const needle = orgSearch.toLowerCase();

		return activeOrgs.filter((org) => fuzzyMatch(needle, org.name));
	}, [activeOrgs, orgSearch]);

	const filteredConnections = useMemo(
		() => filterConnections(userConnections, connectionSearch, []),
		[userConnections, connectionSearch],
	);

	const showSandbox = useMemo(
		() => filterConnections([sandbox], connectionSearch, []).length > 0,
		[sandbox, connectionSearch],
	);

	return (
		<>
			<PageBreadcrumbs items={[{ label: "Overview" }]} />
			<Transition
				duration={250}
				transition="fade-up"
				mounted={!isAuthLoading}
			>
				{(style) => (
					<PageContainer style={style}>
						<SectionTitle>Overview</SectionTitle>

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
									<SearchInput
										placeholder="Search organisations..."
										value={orgSearch}
										onChange={setOrgSearch}
									/>
									<Link href="/o/create">
										<Button
											size="xs"
											variant="gradient"
											rightSection={<Icon path={iconPlus} />}
										>
											Create organisation
										</Button>
									</Link>
								</Group>

								{!isAuthenticated ? (
									<StartCloud
										action="View your organizations"
										image={pictoCloudGradient}
										onClick={() => signIn()}
										mt="sm"
									>
										<PrimaryTitle>
											Get started with SurrealDB Cloud
										</PrimaryTitle>
										<Text>
											Create scalable instances and contexts, collaborate with
											your team, and manage your infrastructure from one
											place.
										</Text>
									</StartCloud>
								) : (
									<>
										{isOrgsLoading && (
											<SimpleGrid
												cols={GRID_COLUMNS}
												mt="sm"
											>
												<Skeleton h={112} />
											</SimpleGrid>
										)}

										{isAuthenticated && filteredOrgs.length > 0 && (
											<SimpleGrid
												cols={GRID_COLUMNS}
												mt="sm"
											>
												{filteredOrgs.map((org) => (
													<OrganizationTile
														key={org.id}
														organization={org}
													/>
												))}
											</SimpleGrid>
										)}
									</>
								)}
							</>
						)}

						<Group mt={showCloud ? 36 : 0}>
							<PrimaryTitle fz={22}>Connections</PrimaryTitle>

							<Spacer />

							<SearchInput
								placeholder="Search connections..."
								value={connectionSearch}
								onChange={setConnectionSearch}
							/>

							<Link href="/c/create">
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
							{showSandbox && (
								<StartConnection
									connection={sandbox}
									onConnect={activateConnection}
								/>
							)}
							{filteredConnections.map((connection) => (
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
								image={pictoSurrealDBGradient}
								onClick={() => adapter.openUrl("https://surrealdb.com/docs")}
							/>
							<StartResource
								title="Community"
								subtitle="Join the discussion on Discord"
								image={pictoHandsOnGradient}
								onClick={() =>
									adapter.openUrl("https://discord.com/invite/surrealdb")
								}
							/>
							<StartResource
								title="University"
								subtitle="Learn the SurrealDB fundamentals in 3 hours"
								image={pictoUniversityGradient}
								onClick={() => adapter.openUrl("https://surrealdb.com/learn")}
							/>
							<StartResource
								title="Sidekick"
								subtitle="Get support from your personal Surreal AI assistant"
								image={pictoSidekickGradient}
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
					</PageContainer>
				)}
			</Transition>
		</>
	);
}
