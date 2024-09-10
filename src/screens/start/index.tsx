import classes from "./style.module.scss";

import clsx from "clsx";
import dayjs from "dayjs";
import logoDarkUrl from "~/assets/images/dark/logo.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import glowUrl from "~/assets/images/start-glow.webp";

import {
	Box,
	Button,
	Center,
	Group,
	Image,
	Paper,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	Title,
	UnstyledButton,
} from "@mantine/core";

import {
	iconBook,
	iconChevronRight,
	iconCloud,
	iconCog,
	iconDiscord,
	iconOpen,
	iconPlus,
	iconSandbox,
	iconServer,
} from "~/util/icons";

import { useRef } from "react";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { SANDBOX } from "~/constants";
import { type NewsPost, useLatestNewsQuery } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { useIsLight, useThemeImage } from "~/hooks/theme";
import { dispatchIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import { isMobile } from "~/util/helpers";
import { Faint } from "~/components/Faint";

interface StartActionProps {
	title: string;
	subtitle: string;
	icon: string;
	onClick: () => void;
}

function StartAction({ title, subtitle, icon, onClick }: StartActionProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton onClick={onClick}>
			<Paper
				p="lg"
				ref={containerRef}
				className={clsx(classes.startBox, classes.startAction)}
				renderRoot={props => <Stack {...props} />}
			>
				<Group
					wrap="nowrap"
					align="start"
				>
					<Text
						c="bright"
						fw={600}
						fz={15}
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
				<Text>{subtitle}</Text>
				<Faint containerRef={containerRef} />
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

function StartResource({ title, subtitle, icon, onClick }: StartResourceProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	return (
		<UnstyledButton onClick={onClick}>
			<Paper
				p="lg"
				className={clsx(classes.startBox)}
				ref={containerRef}
			>
				<Group wrap="nowrap">
					<Icon
						path={icon}
						mx="md"
						size="xl"
					/>
					<Box flex={1}>
						<Text
							c="bright"
							fw={600}
							fz="xl"
						>
							{title}
						</Text>
						<Text>{subtitle}</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						ml="md"
					/>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}

interface StartNewsProps {
	post: NewsPost;
}

function StartNews({ post }: StartNewsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const handleClick = useStable(() => {
		dispatchIntent("open-news", { id: post.id });
	});

	return (
		<UnstyledButton onClick={handleClick}>
			<Paper
				p="lg"
				className={clsx(classes.startBox)}
				ref={containerRef}
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
							backgroundImage: `url("${post.thumbnail}")`,
							backgroundSize: "cover",
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
						<Text c="slate">{dayjs(post.published).fromNow()}</Text>
						<Text mt="sm">{post.description}</Text>
					</Box>
					<Icon
						path={iconChevronRight}
						c="slate"
						size="xl"
					/>
				</Group>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}

export function StartScreen() {
	const { setActiveConnection, setActiveScreen, setActiveView } = useConfigStore.getState();
	const newsQuery = useLatestNewsQuery();
	const isLight = useIsLight();

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
		dark: logoDarkUrl,
	});

	return (
		<Box
			pos="absolute"
			inset={0}
			className={classes.start}
		>
			{!adapter.hasTitlebar && (
				<Box
					data-tauri-drag-region
					className={classes.titlebar}
				/>
			)}

			{isMobile() && (
				<Center
					pos="fixed"
					inset={0}
					bg={isLight ? "slate.0" : "slate.9"}
					style={{ zIndex: 1000 }}
				>
					<Stack
						maw={285}
						mx="auto"
					>
						<Image src={logoUrl} />

						<Text
							fz="xl"
							mt="lg"
						>
							Surrealist is the ultimate way to visually manage your SurrealDB
							database
						</Text>

						<Text>
							Support for Surrealist on mobile platforms is currently unavailable,
							however you can visit Surrealist on a desktop environment to get
							started.
						</Text>

						<Button
							mt="lg"
							variant="gradient"
							onClick={() => adapter.openUrl("https://surrealdb.com/surrealist")}
							rightSection={<Icon path={iconOpen} />}
						>
							Read more about Surrealist
						</Button>
					</Stack>
				</Center>
			)}

			<div
				className={classes.glow}
				style={{
					backgroundImage: `url(${glowUrl})`,
				}}
			/>

			<ScrollArea.Autosize
				h="100%"
				type="scroll"
			>
				<Stack
					justify="center"
					maw={952}
					px="xl"
					mx="auto"
					py="5vw"
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

					<SimpleGrid
						mt={50}
						cols={5}
						spacing="lg"
					>
						<StartAction
							title="Create Connection"
							subtitle="Connect to a remote or local database"
							icon={iconPlus}
							onClick={openConnectionCreator}
						/>
						<StartAction
							title="Open the Sandbox"
							subtitle="Explore SurrealDB right inside Surrealist"
							icon={iconSandbox}
							onClick={openSandbox}
						/>
						<StartAction
							title="Explore Surreal Cloud"
							subtitle="Manage your databases in the cloud"
							icon={iconCloud}
							onClick={openCloud}
						/>
						<StartAction
							title="Manage Connections"
							subtitle="List and manage your existing connections"
							icon={iconServer}
							onClick={() => dispatchIntent("open-connections")}
						/>
						<StartAction
							title="Customize Settings"
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
			</ScrollArea.Autosize>
		</Box>
	);
}
