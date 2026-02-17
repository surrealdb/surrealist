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
import { useInputState } from "@mantine/hooks";
import {
	Icon,
	iconArrowLeft,
	iconArrowUpRight,
	iconCheck,
	iconPlus,
	iconReset,
	iconSearch,
	iconTune,
	iconWarning,
	pictoHandsOn,
	pictoSDBCloud,
	pictoSidekick,
	pictoSurrealDB,
	pictoSurrealist,
	pictoUniversity,
} from "@surrealdb/ui";
import { MouseEvent, useState } from "react";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import logoDarkUrl from "~/assets/images/dark/logo.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { isOrganisationRestricted } from "~/cloud/helpers";
import { useCloudBannerQuery } from "~/cloud/queries/banner";
import { ActionButton } from "~/components/ActionButton";
import { openResourcesLockedModal } from "~/components/App/modals/resources-locked";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { useIsCloudEnabled } from "~/hooks/cloud";
import { useConnectionLabels, useConnectionOverview } from "~/hooks/connection";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { OVERVIEW, useSavepoint } from "~/hooks/overview";
import { useConnectionNavigator } from "~/hooks/routing";
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

	const allRegions = useCloudStore((s) => s.regions);
	const authState = useCloudStore((s) => s.authState);
	const newsPosts = newsQuery.data?.slice(0, 2) ?? [];
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
							maw={1200}
							px="xl"
							mx="auto"
							pb={68}
						>
							<Stack
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
							</Stack>

							{bannerQuery.isSuccess && bannerQuery.data.length > 0 && (
								<Box mb={36}>
									{bannerQuery.data?.map((banner, i) => (
										<CloudAlert
											key={i}
											banner={banner}
										/>
									))}
								</Box>
							)}

							<Group>
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
										placeholder="Search instances..."
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

								{showOrgCreator && (
									<Link href="/organisations/create">
										<Button
											size="xs"
											color="obsidian"
											variant="light"
											rightSection={<Icon path={iconPlus} />}
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
													<Text>SurrealDB Cloud</Text>
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
															{isOrganisationRestricted(
																organization.info,
															) && (
																<Icon
																	path={iconWarning}
																	c="red"
																/>
															)}
															<Icon
																path={iconArrowUpRight}
																className={classes.organisationLink}
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
												{organization.info.resources_locked ? (
													<Button
														size="xs"
														variant="gradient"
														onClick={() =>
															openResourcesLockedModal(
																organization.info,
															)
														}
													>
														Deploy instance
													</Button>
												) : (
													<Link
														href={`/o/${organization.info.id}/deploy`}
													>
														<Button
															size="xs"
															variant="gradient"
														>
															Deploy instance
														</Button>
													</Link>
												)}
											</Group>
											<SimpleGrid
												cols={GRID_COLUMNS}
												mt="xl"
											>
												{organization.instances.map((instance) => (
													<StartInstance
														key={instance.id}
														instance={instance}
														regions={allRegions}
														organisation={organization.info}
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
											<Link href="/connections/create">
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
										Sign in to SurrealDB Cloud
									</PrimaryTitle>
									<StartCloud
										action="Sign in"
										image={pictoSDBCloud}
										onClick={openCloudAuthentication}
									>
										<Text
											span
											fw={500}
											inherit
											c="bright"
										>
											SurrealDB Cloud
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
									rightSection={
										<Icon
											path={iconArrowLeft}
											flip="horizontal"
										/>
									}
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
