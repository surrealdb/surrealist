import classes from "./style.module.scss";

import splashUrl from "~/assets/images/cloud-splash.webp";
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

import { Icon } from "~/components/Icon";
import { useThemeImage } from "~/hooks/theme";
import { dispatchIntent } from "~/util/intents";
import { Spacer } from "~/components/Spacer";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { Fragment } from "react/jsx-runtime";
import { useCloudInstanceList } from "../../../../cloud/hooks/instances";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { adapter } from "~/adapter";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useConfigStore } from "~/stores/config";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useAbsoluteLocation } from "~/hooks/routing";
import { TopGlow } from "~/components/TopGlow";
import { Tooltip } from "@mantine/core";
import { StartNews } from "./content/news";
import { StartResource } from "./content/resource";
import { StartCloud } from "./content/cloud";
import { StartConnection } from "./content/connection";
import { StartCreator } from "./content/creator";
import { StartInstance } from "./content/instance";

const GRID_COLUMNS = {
	xs: 1,
	sm: 2,
	lg: 3,
};

export function OverviewPage() {
	const { setSelectedOrganization } = useCloudStore.getState();
	const [presentation, setPresentation] = useState<"card" | "row">("card"); // TODO config

	const newsQuery = useLatestNewsQuery();
	const [, navigate] = useAbsoluteLocation();
	const { entries, isPending } = useCloudInstanceList();

	const authState = useCloudStore((s) => s.authState);
	const connections = useConnectionList();
	const sandbox = useConfigStore((s) => s.sandbox);
	const newsPosts = newsQuery.data?.slice(0, 5) ?? [];
	const gridColumns = presentation === "card" ? GRID_COLUMNS : 1;

	const userConnections = connections.filter((c) => !c.authentication.cloudInstance);

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

							<Group mt="xl">
								<PrimaryTitle>Connect to SurrealDB</PrimaryTitle>
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
								{authState === "unauthenticated" ? (
									<Button
										size="xs"
										variant="gradient"
										onClick={openCloudAuthentication}
										rightSection={<Icon path={iconChevronRight} />}
									>
										Sign in
									</Button>
								) : (
									<Tooltip label="The ability to create organizations is not currently available">
										<Button
											color="slate"
											size="xs"
											variant="light"
											loading={authState !== "authenticated"}
											rightSection={<Icon path={iconPlus} />}
										>
											New organization
										</Button>
									</Tooltip>
								)}
							</Group>

							<SimpleGrid cols={gridColumns}>
								<StartConnection
									connection={sandbox}
									presentation={presentation}
								/>
								{userConnections.map((connection) => (
									<StartConnection
										key={connection.id}
										connection={connection}
										presentation={presentation}
									/>
								))}
								<StartCreator
									title="New connection"
									subtitle="Connect to a local or remote instance"
									onCreate={createConnection}
								/>
							</SimpleGrid>

							{entries.map(({ organization, instances }) => (
								<Fragment key={organization.id}>
									<Group mt="lg">
										<ThemeIcon
											radius="xs"
											color="slate"
											variant="light"
										>
											<Icon path={iconCloud} />
										</ThemeIcon>
										<Text
											fz="xl"
											fw={500}
										>
											{organization.name}
										</Text>
									</Group>
									<SimpleGrid
										cols={{
											xs: 1,
											sm: 2,
											lg: 3,
										}}
									>
										{instances.map((instance) => (
											<StartInstance
												key={instance.id}
												instance={instance}
												presentation={presentation}
											/>
										))}
										<StartCreator
											title="New instance"
											subtitle="Provision a new Surreal Cloud instance"
											onCreate={() => {
												setSelectedOrganization(organization.id);
												navigate("/provision");
											}}
										/>
									</SimpleGrid>
								</Fragment>
							))}

							{(authState === "loading" || isPending) && (
								<Center mt={52}>
									<Loader />
								</Center>
							)}

							{authState === "unauthenticated" && (
								<>
									<PrimaryTitle mt={52}>Surreal Cloud</PrimaryTitle>
									<StartCloud
										title="Explore Surreal Cloud"
										subtitle="Surreal Cloud redefines the database experience, offering the power and flexibility of SurrealDB without the pain of managing infrastructure."
										icon={iconCloud}
										onClick={openCloudAuthentication}
									/>
								</>
							)}

							<PrimaryTitle mt={52}>Resources</PrimaryTitle>

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

							<PrimaryTitle mt={52}>Latest news</PrimaryTitle>

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
