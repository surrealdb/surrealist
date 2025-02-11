import classes from "./style.module.scss";

import logoDarkUrl from "~/assets/images/dark/logo.webp";
import glowUrl from "~/assets/images/gradient-glow.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";

import {
	Box,
	Button,
	Group,
	Image,
	ScrollArea,
	SimpleGrid,
	Stack,
	Text,
	Title,
} from "@mantine/core";

import { iconChevronRight, iconCloud, iconPlus, iconSandbox } from "~/util/icons";

import { Icon } from "~/components/Icon";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useThemeImage } from "~/hooks/theme";
import { dispatchIntent } from "~/util/intents";
import { StartConnection } from "./content";
import { Spacer } from "~/components/Spacer";
import { useActiveConnection } from "~/hooks/routing";
import { useConnectionList } from "~/hooks/connection";
import { USER_ICONS } from "~/util/user-icons";
import { useStable } from "~/hooks/stable";
import { openCloudAuthentication } from "../../cloud-panel/api/auth";
import { useCloudStore } from "~/stores/cloud";
import { Fragment } from "react/jsx-runtime";
import { useCloudInstanceList } from "../../cloud-panel/hooks/instances";

export function OverviewPage() {
	// const newsQuery = useLatestNewsQuery();
	// const [, navigate] = useLocation();
	const [, setActiveConnection] = useActiveConnection();
	const { entries: cloudSections } = useCloudInstanceList();

	const authState = useCloudStore((s) => s.authState);
	const connections = useConnectionList();
	// const newsPosts = newsQuery.data?.slice(0, 5) ?? [];

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
					maw={1200}
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

					<Group>
						<Title
							mt="xl"
							c="bright"
						>
							Connections
						</Title>
						<Spacer />
						<Button
							size="xs"
							variant="gradient"
							rightSection={<Icon path={iconPlus} />}
							onClick={createConnection}
						>
							Create connection
						</Button>
					</Group>

					<SimpleGrid
						cols={{
							xs: 1,
							sm: 2,
							lg: 3,
						}}
					>
						<StartConnection
							title="Sandbox"
							protocol="mem"
							icon={iconSandbox}
							onConnect={() => {
								setActiveConnection("sandbox");
							}}
						/>
						{connections.map((connection) => (
							<StartConnection
								key={connection.id}
								title={connection.name}
								protocol={connection.authentication.protocol}
								icon={USER_ICONS[connection.icon]}
								withOptions
								onConnect={() => {
									setActiveConnection(connection.id);
								}}
							/>
						))}
					</SimpleGrid>

					<Group mt={64}>
						<Title c="bright">Cloud Instances</Title>
						<Spacer />
						{authState === "authenticated" ? (
							<Button
								size="xs"
								variant="gradient"
								rightSection={<Icon path={iconPlus} />}
								onClick={createConnection}
							>
								Create instance
							</Button>
						) : (
							<Button
								size="xs"
								variant="gradient"
								rightSection={<Icon path={iconChevronRight} />}
								loading={authState === "loading"}
								onClick={openCloudAuthentication}
							>
								Sign in
							</Button>
						)}
					</Group>

					{cloudSections.map(({ organization, instances }) => (
						<Fragment key={organization.id}>
							<Title mt="lg">{organization.name}</Title>
							<SimpleGrid
								cols={{
									xs: 1,
									sm: 2,
									lg: 3,
								}}
							>
								{instances.map((instance) => (
									<StartConnection
										key={instance.id}
										title={instance.name}
										protocol={"wss"}
										icon={iconCloud}
										withOptions
										onConnect={() => {
											// setActiveConnection(connection.id);
										}}
									/>
								))}
							</SimpleGrid>
						</Fragment>
					))}

					{/* <Title
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
					)} */}
				</Stack>
			</ScrollArea>
		</Box>
	);
}
