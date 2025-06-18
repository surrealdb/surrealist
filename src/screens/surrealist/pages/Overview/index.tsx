import classes from "./style.module.scss";

import logoDarkUrl from "~/assets/images/dark/logo.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";

import cloudUrl from "~/assets/images/icons/cloud.webp";
import communityUrl from "~/assets/images/icons/community.webp";
import sidekickUrl from "~/assets/images/icons/sidekick.webp";
import databaseUrl from "~/assets/images/icons/surrealdb.webp";
import universityUrl from "~/assets/images/icons/university.webp";

import {
	Box,
	Button,
	Center,
	Collapse,
	Divider,
	Group,
	Image,
	Indicator,
	Loader,
	Menu,
	Paper,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Transition,
} from "@mantine/core";

import {
	iconArrowLeft,
	iconArrowUpRight,
	iconCheck,
	iconOrganization,
	iconReset,
	iconSearch,
	iconTune,
} from "~/util/icons";

import { useInputState } from "@mantine/hooks";
import { MouseEvent, useState } from "react";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useCloudBannerQuery } from "~/cloud/queries/banner";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useConnectionLabels, useConnectionOverview } from "~/hooks/connection";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { OVERVIEW, useSavepoint } from "~/hooks/overview";
import { useAbsoluteLocation, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useThemeImage } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance, Connection } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { dispatchIntent } from "~/util/intents";
import { CloudAlert } from "./banner";
import { StartBlog } from "./content/blog";
import { StartCloud } from "./content/cloud";
import { StartConnection } from "./content/connection";
import { StartCreator } from "./content/creator";
import { StartInstance } from "./content/instance";
import { StartResource } from "./content/resource";

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
	const [, navigate] = useAbsoluteLocation();
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

	const { isPending, sandbox, userConnections, organizations } = useConnectionOverview({
		search,
		labels: selectedLabels,
		labelMode,
		labelInclude,
		includeEmpty: noFilter,
	});

	const activateConnection = useStable((con: Connection) => {
		navigateConnection(con.id);
	});

	const activateInstance = useStable((instance: CloudInstance) => {
		activateConnection(resolveInstanceConnection(instance));
	});

	const authState = useCloudStore((s) => s.authState);
	const newsPosts = newsQuery.data?.slice(0, 2) ?? [];
	const hasLabels = knownLabels.length > 0;
	const isLoading = authState === "loading" || isPending;
	const showConnections = !isLoading && (sandbox || userConnections.length > 0);
	const hasNoResults = !isLoading && organizations.length === 0 && !showConnections;
	const showOrgCreator = authState === "authenticated" || authState === "loading";

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});

	useSavepoint(OVERVIEW);

	return (
		<Box
			flex={1}
			pos="relative"
		>
			<TopGlow offset={250} />

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
						mt={96}
					>
						<Stack
							className={classes.content}
							justify="center"
							maw={1200}
							px="xl"
							mx="auto"
							pb={96}
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
								<PrimaryTitle fz={22}>Your instances</PrimaryTitle>

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
												color="slate"
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
											<>
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
														labelMode === "any" && (
															<Icon path={iconCheck} />
														)
													}
												>
													Any selected label
												</Menu.Item>
												<Menu.Item
													onClick={() => setLabelMode("all")}
													rightSection={
														labelMode === "all" && (
															<Icon path={iconCheck} />
														)
													}
												>
													All selected labels
												</Menu.Item>
											</>
										</Collapse>
									</Menu.Dropdown>
								</Menu>

								<Paper>
									<TextInput
										value={search}
										onChange={setSearch}
										placeholder="Search instances..."
										leftSection={
											<Icon
												path={iconSearch}
												size="sm"
											/>
										}
										flex={1}
										w={264}
										size="xs"
										variant="unstyled"
										styles={{
											input: { backgroundColor: "unset" },
										}}
									/>
								</Paper>

								{showOrgCreator && (
									<Link href="/create/organisation">
										<Button
											size="xs"
											color="violet"
											variant="light"
											leftSection={<Icon path={iconOrganization} />}
										>
											Create organisation
										</Button>
									</Link>
								)}
							</Group>

							{isLoading && (
								<Center mt={52}>
									<Loader type="dots" />
								</Center>
							)}

							{hasNoResults && (
								<Center mt={52}>
									<Text>No instances match the provided filters</Text>
								</Center>
							)}

							<Stack
								gap={36}
								mt="sm"
							>
								{authState === "authenticated" &&
									organizations.map((organization) => (
										<Box key={organization.info.id}>
											<Group gap="xl">
												<Box>
													<Text>Surreal Cloud</Text>
													<Link href={`/o/${organization.info.id}`}>
														<Group
															gap="sm"
															className={classes.organisationName}
														>
															<PrimaryTitle
																fz={18}
																lh="h1"
																fw={600}
															>
																{organization.info.name}
															</PrimaryTitle>
															<Icon
																path={iconArrowUpRight}
																c="bright"
																size="sm"
																mb={-4}
															/>
														</Group>
													</Link>
												</Box>
												<Divider
													flex={1}
													className={classes.connectionSpacer}
												/>
												<Link href={`/o/${organization.info.id}/deploy`}>
													<Button
														size="xs"
														variant="gradient"
													>
														Deploy instance
													</Button>
												</Link>
											</Group>
											<SimpleGrid
												cols={GRID_COLUMNS}
												mt="xl"
											>
												{organization.instances.map((instance) => (
													<StartInstance
														key={instance.id}
														instance={instance}
														onConnect={activateInstance}
													/>
												))}
												{organization.instances.length === 0 && (
													<StartCreator
														organization={organization.info.id}
													/>
												)}
											</SimpleGrid>
										</Box>
									))}

								{showConnections && (
									<Box>
										<Group gap="xl">
											<Box>
												<Text>Locally configured</Text>
												<PrimaryTitle
													fz={18}
													lh="h1"
													fw={600}
												>
													Connections
												</PrimaryTitle>
											</Box>
											<Divider
												flex={1}
												className={classes.connectionSpacer}
											/>
											<Link href="/create/connection">
												<Button
													size="xs"
													variant="gradient"
												>
													Create connection
												</Button>
											</Link>
										</Group>

										<SimpleGrid
											cols={GRID_COLUMNS}
											mt="xl"
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
											{/* {userConnections.length === 0 && noFilter && (
									<StartCreator
										title="No connections"
										subtitle="Click to create your first connection"
										onCreate={() => navigate("/create/connection")}
									/>
								)} */}
										</SimpleGrid>
									</Box>
								)}
							</Stack>

							{authState === "unauthenticated" && showCloud && (
								<>
									<PrimaryTitle
										mt={36}
										fz={22}
									>
										Sign in to Surreal Cloud
									</PrimaryTitle>
									<StartCloud
										action="Sign in"
										image={cloudUrl}
										onClick={openCloudAuthentication}
									>
										<Text
											span
											inherit
											c="bright"
										>
											Surreal Cloud
										</Text>{" "}
										redefines the database experience, offering the power and
										flexibility of SurrealDB without the pain of managing
										infrastructure. Get your own free instance today.
									</StartCloud>
								</>
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
									image={databaseUrl}
									onClick={() =>
										adapter.openUrl("https://surrealdb.com/docs/surrealdb")
									}
								/>
								<StartResource
									title="Community"
									subtitle="Join the discussion on Discord"
									image={communityUrl}
									onClick={() =>
										adapter.openUrl("https://discord.com/invite/surrealdb")
									}
								/>
								<StartResource
									title="University"
									subtitle="Learn the SurrealDB fundamentals in 3 hours"
									image={universityUrl}
									onClick={() => adapter.openUrl("https://surrealdb.com/learn")}
								/>
								<StartResource
									title="Sidekick"
									subtitle="Get support from your personal Surreal AI assistant"
									image={sidekickUrl}
									onClick={() => navigate("/chat")}
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
									rightSection={
										<Icon
											path={iconArrowLeft}
											flip="horizontal"
										/>
									}
									onClick={() => dispatchIntent("open-news")}
									color="slate"
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
