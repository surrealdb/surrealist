import {
	Box,
	Button,
	Center,
	Collapse,
	Group,
	Indicator,
	Loader,
	Menu,
	Paper,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	Transition,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import {
	Icon,
	iconArrowUpRight,
	iconCheck,
	iconPlus,
	iconReset,
	iconSearch,
	iconTune,
	pictoCloud,
	pictoHandsOn,
	pictoSidekick,
	pictoSurrealDB,
	pictoUniversity,
} from "@surrealdb/ui";
import { MouseEvent, useState } from "react";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { isOrganisationTerminated } from "~/cloud/helpers";
import { useCloudBannerQuery } from "~/cloud/queries/banner";
import { useCloudOrganizationsQuery } from "~/cloud/queries/organizations";
import { ActionButton } from "~/components/ActionButton";
import { PageBreadcrumbs } from "~/components/PageBreadcrumbs";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useConnectionLabels, useConnectionOverview } from "~/hooks/connection";
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
	const knownLabels = useConnectionLabels();
	const showCloud = useIsCloudEnabled();

	const newsQuery = useLatestNewsQuery();
	const bannerQuery = useCloudBannerQuery();
	const navigateConnection = useConnectionNavigator();

	const [search, setSearch] = useInputState("");
	const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
	const [labelMode, setLabelMode] = useState<"any" | "all">("any");
	const [labelInclude, setLabelInclude] = useState(true);

	const noFilter = !search && selectedLabels.length === 0;

	const toggleLabel = (e: MouseEvent, labelToToggle: string) => {
		if (e.ctrlKey || e.metaKey) {
			setSelectedLabels([labelToToggle]);
			return;
		}

		setSelectedLabels((current) =>
			current.includes(labelToToggle)
				? current.filter((label) => label !== labelToToggle)
				: [...current, labelToToggle],
		);
	};

	const {
		isPending: isConnectionsPending,
		sandbox,
		userConnections,
	} = useConnectionOverview({
		search,
		labels: selectedLabels,
		labelMode,
		labelInclude,
		includeEmpty: noFilter,
	});

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

	const isConnectionsLoading = isConnectionsPending;
	const showConnections = !isConnectionsLoading && (sandbox || userConnections.length > 0);

	const handleCreateOrganisation = useStable(() => {
		if (authState === "authenticated") {
			return;
		}

		openCloudAuthentication();
	});

	// const logoUrl = useThemeImage({
	// 	light: logoLightUrl,
	// 	dark: logoDarkUrl,
	// });

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

							{/* <Stack
								align="center"
								gap={0}
								mb={52}
							>
								<Image
									src={pictoSurrealist}
									w={74}
								/>

								<Image
									src={logoUrl}
									w={200}
									mt="md"
								/>

								<Text
									mt="xs"
									opacity={0.4}
									c="bright"
								>
									Version {import.meta.env.VERSION}
								</Text>
							</Stack> */}

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
										{authState === "authenticated" ? (
											<Link href="/organisations/create">
												<Button
													size="xs"
													variant="gradient"
													rightSection={<Icon path={iconPlus} />}
												>
													Create organisation
												</Button>
											</Link>
										) : (
											<Button
												size="xs"
												variant="gradient"
												rightSection={<Icon path={iconPlus} />}
												onClick={handleCreateOrganisation}
											>
												Create organisation
											</Button>
										)}
									</Group>

									{isOrgsLoading && (
										<SimpleGrid
											cols={GRID_COLUMNS}
											mt="sm"
										>
											<Skeleton h={112} />
										</SimpleGrid>
									)}

									{/* {!isOrgsLoading && activeOrgs.length === 0 && (
										<Center mt="lg">
											<Text c="dimmed">
												{authState === "authenticated"
													? "You don't have any organisations yet"
													: "Sign in to view your organisations"}
											</Text>
										</Center>
									)} */}

									{authState !== "authenticated" && (
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

								<Menu closeOnItemClick={false}>
									<Menu.Target>
										<Indicator
											disabled={selectedLabels.length === 0}
											color="violet"
											size={14}
											label={selectedLabels.length}
										>
											<ActionButton
												variant="subtle"
												color="obsidian"
												label="Filter connections"
											>
												<Icon path={iconTune} />
											</ActionButton>
										</Indicator>
									</Menu.Target>
									<Menu.Dropdown miw={220}>
										<Group justify="space-between">
											<Menu.Label py="xs">Labels</Menu.Label>
											{selectedLabels.length > 0 && (
												<ActionButton
													size="sm"
													mr="xs"
													label="Reset filter"
													variant="subtle"
													onClick={() => setSelectedLabels([])}
												>
													<Icon path={iconReset} />
												</ActionButton>
											)}
										</Group>
										{knownLabels.length === 0 && (
											<Text
												maw={200}
												px="sm"
												pb="sm"
											>
												No labels available. Add labels to your connections
												to filter them here.
											</Text>
										)}
										{knownLabels.map((option) => {
											const isActive = selectedLabels.includes(option);

											return (
												<Menu.Item
													key={option}
													onClick={(e) => toggleLabel(e, option)}
													rightSection={
														isActive && <Icon path={iconCheck} />
													}
												>
													{option}
												</Menu.Item>
											);
										})}
										<Collapse in={selectedLabels.length > 0}>
											<Menu.Divider />
											<Menu.Label mt="sm">Visibility</Menu.Label>
											<Menu.Item
												onClick={() => setLabelInclude(true)}
												rightSection={
													labelInclude && <Icon path={iconCheck} />
												}
											>
												Show matching items
											</Menu.Item>
											<Menu.Item
												onClick={() => setLabelInclude(false)}
												rightSection={
													!labelInclude && <Icon path={iconCheck} />
												}
											>
												Hide matching items
											</Menu.Item>

											<Menu.Divider />
											<Menu.Label mt="sm">Method</Menu.Label>
											<Menu.Item
												onClick={() => setLabelMode("any")}
												rightSection={
													labelMode === "any" && <Icon path={iconCheck} />
												}
											>
												Any selected label
											</Menu.Item>
											<Menu.Item
												onClick={() => setLabelMode("all")}
												rightSection={
													labelMode === "all" && <Icon path={iconCheck} />
												}
											>
												All selected labels
											</Menu.Item>
										</Collapse>
									</Menu.Dropdown>
								</Menu>

								<Paper>
									<TextInput
										value={search}
										onChange={setSearch}
										placeholder="Search connections..."
										leftSection={
											<Icon
												path={iconSearch}
												size="sm"
											/>
										}
										flex={1}
										w={182}
										size="xs"
										variant="unstyled"
										styles={{
											input: { backgroundColor: "unset" },
										}}
									/>
								</Paper>

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

							{isConnectionsLoading && (
								<Center mt={52}>
									<Loader type="dots" />
								</Center>
							)}

							{showConnections && (
								<SimpleGrid
									cols={GRID_COLUMNS}
									mt="sm"
								>
									{sandbox && (
										<StartConnection
											connection={sandbox}
											onConnect={activateConnection}
										/>
									)}
									{userConnections.map((connection) => (
										<StartConnection
											key={connection.id}
											connection={connection}
											onConnect={activateConnection}
										/>
									))}
								</SimpleGrid>
							)}

							{!isConnectionsLoading && !showConnections && !noFilter && (
								<Center mt={52}>
									<Text>No connections match the provided filters</Text>
								</Center>
							)}

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
