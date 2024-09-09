import classes from "./style.module.scss";
import iconUrl from "~/assets/images/icon.webp";
import glowUrl from "~/assets/images/start-glow.webp";
import cornerUrl from "~/assets/images/start-corner.svg";
import logoDarkUrl from "~/assets/images/dark/logo.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import { Box, Button, Center, Group, Image, Paper, ScrollArea, SimpleGrid, Skeleton, Stack, Text, Title, UnstyledButton } from "@mantine/core";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { SANDBOX } from "~/constants";
import { adapter } from "~/adapter";
import { dispatchIntent } from "~/hooks/url";
import { useIsLight, useThemeImage } from "~/hooks/theme";
import { Icon } from "~/components/Icon";
import { iconBook, iconChevronRight, iconCloud, iconCog, iconDiscord, iconPlus, iconServer, iconSurreal } from "~/util/icons";
import { type NewsPost, useLatestNewsQuery } from "~/hooks/newsfeed";
import { Entry } from "~/components/Entry";
import clsx from "clsx";
import dayjs from "dayjs";

interface StartScreenProps {
	title: string;
	subtitle: string;
	icon: string;
	onClick: () => void;
}

function StartAction({
	title,
	subtitle,
	icon,
	onClick,
}: StartScreenProps) {
	return (
		<UnstyledButton onClick={onClick}>
			<Paper
				p="lg"
				className={clsx(classes.startBox, classes.startAction)}
			>
				<img
					src={cornerUrl}
					className={classes.startActionCorner}
					alt=""
				/>
				<Group
					wrap="nowrap"
					align="start"
				>
					<Text
						c="bright"
						fw={600}
						fz="xl"
						flex={1}
					>
						{title}
					</Text>
					<Icon
						className={classes.startActionIcon}
						path={icon}
						size="xl"
					/>
				</Group>
				<Text mt="xl">
					{subtitle}
				</Text>
			</Paper>
		</UnstyledButton> 
	);
}

interface StartResourceProps {
	title: string;
	subtitle: string;
	icon: string;
	onClick: () => void;
}

function StartResource({
	title,
	subtitle,
	icon,
	onClick,
}: StartResourceProps) {
	const isLight = useIsLight();
	
	return (
		<Entry
			h={84}
			size="xl"
			onClick={onClick}
			className={classes.startBox}
			leftSection={
				<Icon path={icon} size={0.95} ml="md" />
			}
			rightSection={
				<Icon path={iconChevronRight} c="slate" />
			}
		>
			<Stack gap={3} align="start" ml="sm">
				{title}
				<Text
					fz="xs"
					c={isLight ? "slate.6" : "slate.3"}
				>
					{subtitle}
				</Text>
			</Stack>
		</Entry>
	);
}

interface StartNewsProps {
	post: NewsPost;
}

function StartNews({
	post,
}: StartNewsProps) {

	const handleClick = useStable(() => {
		dispatchIntent("open-news", { id: post.id });
	});

	return (
		<UnstyledButton onClick={handleClick}>
			<Paper
				p="lg"
				className={clsx(classes.startBox)}
			>
				<Group
					gap="xl"
					wrap="nowrap"
				>
					<Paper
						h={110}
						w={200}
						style={{
							flexShrink: 0,
							borderRadius: 12,
							border: '1px solid rgba(255, 255, 255, 0.2)',
							backgroundOrigin: 'border-box',
							backgroundImage: `url("${post.thumbnail}")`,
							backgroundSize: 'cover',
						}}
					/>
					<Box
						h="100%"
						flex={1}
						style={{ alignSelf: "start" }}
					>
						<Title
							c="bright"
							fz="xl"
						>
							{post.title}
						</Title>
						<Text
							c="slate"
						>
							{dayjs(post.published).fromNow()}
						</Text>
						<Text
							mt="sm"
						>
							{post.description}
						</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						c="slate"
						size="xl"
					/>
				</Group>
			</Paper>
		</UnstyledButton>
	);
}

export function StartScreen() {
	const { setActiveConnection, setActiveScreen, setActiveView } = useConfigStore.getState();
	const newsQuery = useLatestNewsQuery();

	const newsPosts = newsQuery.data?.slice(0, 5) ?? [];

	const openSandbox = useStable(() => {
		setActiveConnection(SANDBOX);
	});

	const openConnectionCreator = useStable(() => {
		dispatchIntent("new-connection");
	});

	const openCloud = useStable(() => {
		setActiveScreen("database");
		setActiveView("cloud");
	});

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl
	});

	return (
		<Box
			pos="absolute"
			inset={0}
			className={classes.start}
		>
			{!adapter.hasTitlebar && (
				<Box data-tauri-drag-region className={classes.titlebar} />
			)}

			<div
				className={classes.glow}
				style={{
					backgroundImage: `url(${glowUrl})`
				}}
			/>

			<ScrollArea.Autosize
				h="100%"
				type="scroll"
			>
				<Stack
					justify="center"
					maw={900}
					mx="auto"
					py="5vw"
				>
					<Stack align="center">
						<Image
							src={iconUrl}
							w={85}
						/>

						<Image
							src={logoUrl}
							w={225}
							mt="xs"
						/>

						<Text
							opacity={0.4}
							c="bright"
							mt={6}
						>
							Version {import.meta.env.VERSION}
						</Text>
					</Stack>

					<SimpleGrid
						mt="xl"
						cols={5}
						spacing="lg"
					>
						<StartAction
							title="Create connection"
							subtitle="Connect to a remote or local database"
							icon={iconPlus}
							onClick={openConnectionCreator}
						/>
						<StartAction
							title="Open the Sandbox"
							subtitle="Explore SurrealDB right inside Surrealist"
							icon={iconSurreal}
							onClick={openSandbox}
						/>
						<StartAction
							title="Surreal Cloud"
							subtitle="Manage your databases in the cloud"
							icon={iconCloud}
							onClick={openCloud}
						/>
						<StartAction
							title="Manage Connections"
							subtitle="Manage your existing connections"
							icon={iconServer}
							onClick={() => dispatchIntent("open-connections")}
						/>
						<StartAction
							title="Settings"
							subtitle="Configure Surrealist to your liking"
							icon={iconCog}
							onClick={() => dispatchIntent("open-settings")}
						/>
					</SimpleGrid>

					<Title
						mt="xl"
						c="bright"
					>
						Resources
					</Title>

					<SimpleGrid cols={2}>
						<StartResource
							title="Documentation"
							subtitle="Learn more about Surrealist"
							icon={iconBook}
							onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealist")}
						/>
						<StartResource
							title="Community"
							subtitle="Join the discussion on Discord"
							icon={iconDiscord}
							onClick={() => adapter.openUrl("https://discord.com/invite/surrealdb")}
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
			</ScrollArea.Autosize>
		</Box>
	);
}
