import classes from "./style.module.scss";

import clsx from "clsx";
import dayjs from "dayjs";
import splashUrl from "~/assets/images/cloud-splash.webp";
import logoDarkUrl from "~/assets/images/dark/logo.webp";
import glowUrl from "~/assets/images/gradient-glow.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";

import {
	Box,
	Button,
	Center,
	Flex,
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
	iconCog,
	iconDiscord,
	iconPlus,
	iconQuery,
	iconSandbox,
	iconServer,
	iconSidekick,
} from "~/util/icons";

import { PropsWithChildren, useRef } from "react";
import { useLocation } from "wouter";
import { adapter } from "~/adapter";
import { Faint } from "~/components/Faint";
import { Icon } from "~/components/Icon";
import { Spacer } from "~/components/Spacer";
import { SANDBOX } from "~/constants";
import { type NewsPost, useLatestNewsQuery } from "~/hooks/newsfeed";
import { useStable } from "~/hooks/stable";
import { useThemeImage } from "~/hooks/theme";
import { useConfigStore } from "~/stores/config";
import { dispatchIntent } from "~/util/intents";

interface StartActionProps {
	title: string;
	subtitle: string;
	icon?: string;
	onClick: () => void;
}

function StartAction({
	title,
	subtitle,
	icon,
	onClick,
	children,
}: PropsWithChildren<StartActionProps>) {
	const containerRef = useRef<HTMLDivElement>(null);

	return (
		<UnstyledButton onClick={onClick}>
			<Paper
				p="xl"
				pos="relative"
				ref={containerRef}
				className={clsx(classes.startBox, classes.startAction)}
				renderRoot={(props) => <Stack {...props} />}
			>
				<Group
					wrap="nowrap"
					align="start"
					h="100%"
				>
					<Text
						c="bright"
						fw={600}
						fz={15}
					>
						{title}
					</Text>
					<Spacer />
					{icon && (
						<Icon
							className={classes.startActionIcon}
							path={icon}
							size="xl"
						/>
					)}
				</Group>
				<Text maw={450}>{subtitle}</Text>
				{children}
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
				className={clsx(classes.startBox, classes.startResource)}
				ref={containerRef}
			>
				<Group
					wrap="nowrap"
					h="100%"
				>
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
				className={clsx(classes.startBox, classes.startNews)}
				ref={containerRef}
			>
				<Flex
					gap="xl"
					className={classes.startNewsInner}
				>
					<Paper
						className={classes.startNewsThumbnail}
						style={{
							backgroundImage: `url("${post.thumbnail}")`,
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
						style={{
							alignSelf: "center",
						}}
					/>
				</Flex>
				<Faint containerRef={containerRef} />
			</Paper>
		</UnstyledButton>
	);
}

export function StartPage() {
	const { setActiveConnection } = useConfigStore.getState();
	const newsQuery = useLatestNewsQuery();

	const [, navigate] = useLocation();

	const newsPosts = newsQuery.data?.slice(0, 5) ?? [];

	const openSandbox = useStable(() => {
		setActiveConnection(SANDBOX);
		navigate("/query");
	});

	const openConnectionCreator = useStable(() => {
		dispatchIntent("new-connection");
	});

	const openCloud = useStable(() => {
		navigate("/cloud");
	});

	const openConnectionList = useStable(() => {
		dispatchIntent("open-connections");
	});

	const openSettings = useStable(() => {
		dispatchIntent("open-settings");
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
					maw={952}
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

					<Stack
						mt={50}
						gap="lg"
					>
						<StartAction
							title="Explore Surreal Cloud"
							subtitle="Surreal Cloud redefines the database experience, offering the power and
					flexibility of SurrealDB without the pain of managing infrastructure."
							onClick={openCloud}
						>
							<Image
								src={splashUrl}
								w={325}
								pos="absolute"
								right={0}
								bottom={0}
								style={{ zIndex: 0 }}
								className={classes.cloudImage}
							/>
						</StartAction>

						<SimpleGrid
							spacing="lg"
							cols={{
								xs: 1,
								sm: 2,
								md: 4,
							}}
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
								title="Manage Connections"
								subtitle="List and manage your existing connections"
								icon={iconServer}
								onClick={openConnectionList}
							/>
							<StartAction
								title="Customize Settings"
								subtitle="Configure Surrealist to your liking"
								icon={iconCog}
								onClick={openSettings}
							/>
						</SimpleGrid>
					</Stack>

					<Title
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
							icon={iconDiscord}
							onClick={() => adapter.openUrl("https://discord.com/invite/surrealdb")}
						/>
						<StartResource
							title="University"
							subtitle="Learn the SurrealDB fundamentals in 3 hours"
							icon={iconQuery}
							onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealist")}
						/>
						<StartResource
							title="Sidekick"
							subtitle="Get support from your personal Surreal AI assistant"
							icon={iconSidekick}
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
			</ScrollArea>
		</Box>
	);
}
