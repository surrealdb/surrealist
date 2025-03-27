import classes from "./style.module.scss";

import logoDarkUrl from "~/assets/images/dark/logo.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";

import {
	Box,
	Button,
	Center,
	Group,
	Image,
	Indicator,
	Loader,
	Menu,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Transition,
} from "@mantine/core";

import {
	iconAccount,
	iconBook,
	iconCheck,
	iconChevronDown,
	iconChevronRight,
	iconCloud,
	iconCommunity,
	iconPlus,
	iconSearch,
	iconServer,
	iconSidekick,
	iconTune,
	iconUniversity,
} from "~/util/icons";

import { useInputState } from "@mantine/hooks";
import { useState } from "react";
import { Fragment } from "react/jsx-runtime";
import { adapter } from "~/adapter";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useCloudBannerQuery } from "~/cloud/queries/banner";
import { ActionButton } from "~/components/ActionButton";
import { Icon } from "~/components/Icon";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Spacer } from "~/components/Spacer";
import { TopGlow } from "~/components/TopGlow";
import { useConnectionLabels, useConnectionOverview } from "~/hooks/connection";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useAbsoluteLocation, useConnectionNavigator } from "~/hooks/routing";
import { useStable } from "~/hooks/stable";
import { useIsLight, useThemeImage } from "~/hooks/theme";
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
	const knownLabels = useConnectionLabels();
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

	const toggleLabel = (labelToToggle: string) => {
		setSelectedLabels(prevLabels =>
			prevLabels.includes(labelToToggle)
				? prevLabels.filter(label => label !== labelToToggle)
				: [...prevLabels, labelToToggle]
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
	const newsPosts = newsQuery.data?.slice(0, 5) ?? [];
	const hasLabels = knownLabels.length > 0;

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
								{hasLabels && (
									<Menu
										closeOnItemClick={false}
									>
										<Menu.Target>
											<Indicator
												disabled={selectedLabels.length === 0}
												color="blue"
												size={7}
												label={selectedLabels.length > 0 ? selectedLabels.length : undefined}
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
											<Menu.Label>Labels</Menu.Label>
											{knownLabels.map((option) => {
												const isActive = selectedLabels.includes(option);

												return (
													<Menu.Item
														key={option}
														onClick={() => toggleLabel(option)}
														rightSection={
															isActive && <Icon path={iconCheck} />
														}
													>
														{option}
													</Menu.Item>
												);
											})}

											<Menu.Divider />
											<Menu.Label>Filter Type</Menu.Label>
											<Menu.Item
												disabled={selectedLabels.length === 0}
												onClick={() => setLabelInclude(true)}
												rightSection={labelInclude && <Icon path={iconCheck} />}
											>
												Show matching items
											</Menu.Item>
											<Menu.Item
												disabled={selectedLabels.length === 0}
												onClick={() => setLabelInclude(false)}
												rightSection={!labelInclude && <Icon path={iconCheck} />}
											>
												Hide matching items
											</Menu.Item>

											<Menu.Divider />
											<Menu.Label>Match Method</Menu.Label>
											<Menu.Item
												disabled={selectedLabels.length === 0}
												onClick={() => setLabelMode("any")}
												rightSection={labelMode === "any" && <Icon path={iconCheck} />}
											>
												Match any selected label
											</Menu.Item>
											<Menu.Item
												disabled={selectedLabels.length === 0}
												onClick={() => setLabelMode("all")}
												rightSection={labelMode === "all" && <Icon path={iconCheck} />}
											>
												Match all selected labels
											</Menu.Item>
										</Menu.Dropdown>
									</Menu>
								)}
								<TextInput
									value={search}
									onChange={setSearch}
									placeholder="Search instances"
									leftSection={
										<Icon
											path={iconSearch}
											size="sm"
										/>
									}
									radius="sm"
									size="xs"
									className={classes.search}
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
											onClick={() => {
												navigate("/create/connection");
											}}
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
										<Menu.Label mt="sm">Surreal Cloud</Menu.Label>
										<Menu.Item
											disabled={authState !== "authenticated"}
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
											onClick={() => {
												navigate("/create/instance");
											}}
										>
											<Box>
												<Text
													c="bright"
													fw={600}
												>
													Cloud Instance
												</Text>
												<Text>Create a managed cloud instance</Text>
											</Box>
										</Menu.Item>
										<Menu.Item
											disabled
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
											onClick={() => {
												navigate("/create/organization");
											}}
										>
											<Box>
												<Text
													c="bright"
													fw={600}
												>
													Organization
												</Text>
												<Text>Create a space to manage your team</Text>
											</Box>
										</Menu.Item>
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

							{authState === "authenticated" &&
								organizations.map(({ info, instances }) => (
									<Fragment key={info.id}>
										<Group
											gap="xs"
											mt="xl"
										>
											<PrimaryTitle fz="xl">Surreal Cloud</PrimaryTitle>
											<Icon
												path={iconChevronRight}
												c="slate"
												size="lg"
											/>
											<PrimaryTitle fz="xl">{info.name}</PrimaryTitle>
										</Group>
										<SimpleGrid cols={GRID_COLUMNS}>
											{instances.map((instance) => (
												<StartInstance
													key={instance.id}
													instance={instance}
													onConnect={activateInstance}
												/>
											))}
											{instances.length === 0 && (
												<StartCreator
													title="No instances"
													subtitle="Click to provision a new instance"
													onCreate={() => {
														setSelectedOrganization(info.id);
														navigate("/create/instance");
													}}
												/>
											)}
										</SimpleGrid>
									</Fragment>
								))}

							{(authState === "loading" || isPending) && (
								<Center mt={52}>
									<Loader type="dots" />
								</Center>
							)}

							{authState === "unauthenticated" && (
								<>
									<PrimaryTitle mt="xl">Surreal Cloud</PrimaryTitle>
									<StartCloud
										title="Try Surreal Cloud"
										subtitle="Surreal Cloud redefines the database experience, offering the power and flexibility of SurrealDB without the pain of managing infrastructure. Get your own free instance today."
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
