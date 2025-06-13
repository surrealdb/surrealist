import classes from "./style.module.scss";

import logoDarkUrl from "~/assets/images/dark/logo.webp";
import databaseUrl from "~/assets/images/database.png";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import sidekickUrl from "~/assets/images/sidekick.png";
import communityUrl from "~/assets/images/surrealism.png";
import universityUrl from "~/assets/images/university.png";

import {
	Box,
	Button,
	Center,
	Collapse,
	Group,
	Image,
	Indicator,
	Loader,
	Menu,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Transition,
} from "@mantine/core";

import {
	iconAccount,
	iconArrowLeft,
	iconCheck,
	iconChevronDown,
	iconCloud,
	iconOpen,
	iconPlus,
	iconReset,
	iconSearch,
	iconTune,
} from "~/util/icons";

import { useInputState } from "@mantine/hooks";
import { MouseEvent, useState } from "react";
import { Link } from "wouter";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { createInstancePath } from "~/cloud/helpers";
import { useHasOrganizationRole } from "~/cloud/hooks/role";
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
import { useIsLight, useThemeImage } from "~/hooks/theme";
import { useCloudStore } from "~/stores/cloud";
import { CloudInstance, CloudOrganization, Connection } from "~/types";
import { resolveInstanceConnection } from "~/util/connection";
import { dispatchIntent } from "~/util/intents";
import { CloudAlert } from "./banner";
import { StartBlog } from "./content/blog";
import { StartConnection } from "./content/connection";
import { StartCreator } from "./content/creator";
import { StartInstance } from "./content/instance";
import { StartPlaceholder } from "./content/placeholder";
import { StartResource } from "./content/resource";
import { StartCloud } from "./content/cloud";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OverviewPage() {
	const knownLabels = useConnectionLabels();
	const showCloud = useIsCloudEnabled();
	const isLight = useIsLight();

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

	const hasNoInstances = organizations.every((org) => org.instances.length === 0);

	const activateConnection = useStable((con: Connection) => {
		navigateConnection(con.id);
	});

	const activateInstance = useStable((instance: CloudInstance) => {
		activateConnection(resolveInstanceConnection(instance));
	});

	const authState = useCloudStore((s) => s.authState);
	const newsPosts = newsQuery.data?.slice(0, 2) ?? [];
	const hasLabels = knownLabels.length > 0;

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
						viewportProps={{
							style: { paddingBottom: 75 },
						}}
					>
						<Stack
							className={classes.content}
							justify="center"
							maw={1200}
							px="xl"
							mx="auto"
							pt={78}
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
								<PrimaryTitle fz={22}>Connections</PrimaryTitle>
								<Spacer />
								{hasLabels && (
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
													disabled={!hasLabels}
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
															labelInclude && (
																<Icon path={iconCheck} />
															)
														}
													>
														Show matching items
													</Menu.Item>
													<Menu.Item
														onClick={() => setLabelInclude(false)}
														rightSection={
															!labelInclude && (
																<Icon path={iconCheck} />
															)
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
								)}
								<TextInput
									value={search}
									onChange={setSearch}
									placeholder="Search connections"
									leftSection={
										<Icon
											path={iconSearch}
											size="sm"
										/>
									}
									size="xs"
									flex={1}
									maw={264}
								/>

								<Menu
									transitionProps={{ transition: "scale-y" }}
									position="bottom-end"
								>
									<Menu.Target>
										<Button
											size="xs"
											color="slate"
											variant="gradient"
											rightSection={<Icon path={iconChevronDown} />}
										>
											Create new
										</Button>
									</Menu.Target>
									<Menu.Dropdown>
										<Link to="/create/connection">
											<Menu.Item
												leftSection={
													<ThemeIcon
														color={isLight ? "slate" : "slate.0"}
														mr="xs"
														radius="xs"
														size="lg"
														variant="light"
													>
														<Icon
															path={iconPlus}
															size="lg"
														/>
													</ThemeIcon>
												}
											>
												<Box>
													<Text
														c="bright"
														fw={600}
													>
														Connection
													</Text>
													<Text>Connect to any SurrealDB instance</Text>
												</Box>
											</Menu.Item>
										</Link>
										{showCloud && (
											<>
												<Menu.Label mt="sm">Surreal Cloud</Menu.Label>
												<Link to="/create/instance">
													<Menu.Item
														leftSection={
															<ThemeIcon
																color="surreal"
																mr="xs"
																radius="xs"
																size="lg"
																variant="light"
															>
																<Icon
																	path={iconCloud}
																	size="lg"
																/>
															</ThemeIcon>
														}
													>
														<Box>
															<Text
																c="bright"
																fw={600}
															>
																Cloud Instance
															</Text>
															<Text>
																Create a managed cloud instance
															</Text>
														</Box>
													</Menu.Item>
												</Link>
												<Link to="/create/organisation">
													<Menu.Item
														leftSection={
															<ThemeIcon
																color="violet"
																mr="xs"
																radius="xs"
																size="lg"
																variant="light"
															>
																<Icon
																	path={iconAccount}
																	size="lg"
																/>
															</ThemeIcon>
														}
													>
														<Box>
															<Text
																c="bright"
																fw={600}
															>
																Organisation
															</Text>
															<Text>
																Create a space to manage your team
															</Text>
														</Box>
													</Menu.Item>
												</Link>
											</>
										)}
									</Menu.Dropdown>
								</Menu>
							</Group>

							<SimpleGrid cols={GRID_COLUMNS}>
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
								{userConnections.length === 0 && noFilter && (
									<StartCreator
										title="No connections"
										subtitle="Click to create your first connection"
										onCreate={() => navigate("/create/connection")}
									/>
								)}
							</SimpleGrid>

							{(authState === "loading" || isPending) && (
								<Center mt={52}>
									<Loader type="dots" />
								</Center>
							)}

							{authState === "authenticated" &&
								!hasNoInstances &&
								organizations.map((organization) => (
									<OrganizationInstances
										key={organization.info.id}
										organization={organization}
										onConnect={activateInstance}
									/>
								))}

							{authState === "authenticated" && hasNoInstances && (
								<>
									<PrimaryTitle
										mt={36}
										fz={22}
									>
										Deploy your first instance
									</PrimaryTitle>
									<StartCloud
										action="Configure your instance"
										onClick={() => navigate("/create/instance")}
									>
										Get started with{" "}
										<Text
											span
											inherit
											c="bright"
											fw={500}
										>
											Surreal Cloud
										</Text>{" "}
										deploying your first instance. Get your own free instance
										today.
									</StartCloud>
								</>
							)}

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
										onClick={openCloudAuthentication}
									>
										<Text
											span
											inherit
											c="bright"
											fw={500}
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

interface OrganizationInstancesProps {
	organization: {
		info: CloudOrganization;
		instances: CloudInstance[];
	};
	onConnect: (instance: CloudInstance) => void;
}

function OrganizationInstances({ organization, onConnect }: OrganizationInstancesProps) {
	const [, navigate] = useAbsoluteLocation();
	const isAdmin = useHasOrganizationRole(organization.info.id, "admin");

	return (
		<>
			<Group mt="xl">
				<Box>
					<Text>Surreal Cloud</Text>
					<Link href={`/o/${organization.info.id}`}>
						<Group gap="sm">
							<PrimaryTitle
								fz="xl"
								lh="h1"
								className={classes.organisationName}
							>
								{organization.info.name}
							</PrimaryTitle>
							<Icon
								path={iconOpen}
								c="bright"
								size="sm"
								mb={-4}
							/>
						</Group>
					</Link>
				</Box>
			</Group>
			<SimpleGrid
				cols={GRID_COLUMNS}
				mt="xs"
			>
				{organization.instances.map((instance) => (
					<StartInstance
						key={instance.id}
						instance={instance}
						onConnect={onConnect}
					/>
				))}
				{organization.instances.length === 0 &&
					(isAdmin ? (
						<StartCreator
							title="No instances"
							subtitle="Click to provision a new instance"
							onCreate={() => navigate(createInstancePath(organization.info))}
						/>
					) : (
						<StartPlaceholder
							title="No instances"
							subtitle="This organisation has no instances"
						/>
					))}
			</SimpleGrid>
		</>
	);
}
