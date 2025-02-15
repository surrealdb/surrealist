import classes from "./style.module.scss";

import splashUrl from "~/assets/images/cloud-splash.webp";
import logoDarkUrl from "~/assets/images/dark/logo.webp";
import glowUrl from "~/assets/images/gradient-glow.webp";
import iconUrl from "~/assets/images/icon.webp";
import logoLightUrl from "~/assets/images/light/logo.webp";
import cloudIconUrl from "~/assets/images/cloud-icon.webp";

import {
	ActionIcon,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Image,
	ScrollArea,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";

import {
	iconBook,
	iconChevronRight,
	iconCloud,
	iconCommunity,
	iconCreditCard,
	iconReferral,
	iconSearch,
	iconSidekick,
	iconUniversity,
	iconViewGrid,
	iconViewList,
} from "~/util/icons";

import { Icon } from "~/components/Icon";
import { useThemeImage } from "~/hooks/theme";
import { dispatchIntent } from "~/util/intents";
import {
	StartAction,
	StartConnection,
	StartCreator,
	StartInstance,
	StartNews,
	StartResource,
} from "./content";
import { Spacer } from "~/components/Spacer";
import { useConnectionList } from "~/hooks/connection";
import { useStable } from "~/hooks/stable";
import { useCloudStore } from "~/stores/cloud";
import { Fragment } from "react/jsx-runtime";
import { useCloudInstanceList } from "../../../../cloud/hooks/instances";
import { useState } from "react";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { adapter } from "~/adapter";
import { useLocation } from "wouter";
import { useLatestNewsQuery } from "~/hooks/newsfeed";
import { useConfigStore } from "~/stores/config";
import { openCloudAuthentication } from "~/cloud/api/auth";
import { useAbsoluteLocation } from "~/hooks/routing";

export function OverviewPage() {
	const { setSelectedOrganization } = useCloudStore.getState();

	const newsQuery = useLatestNewsQuery();
	const [, navigate] = useAbsoluteLocation();
	const { entries: cloudSections } = useCloudInstanceList();

	const authState = useCloudStore((s) => s.authState);
	const connections = useConnectionList();
	const sandbox = useConfigStore((s) => s.sandbox);
	const newsPosts = newsQuery.data?.slice(0, 5) ?? [];

	const userConnections = connections.filter((c) => !c.authentication.cloudInstance);

	const createConnection = useStable(() => {
		dispatchIntent("new-connection");
	});

	const logoUrl = useThemeImage({
		light: logoLightUrl,
		dark: logoDarkUrl,
	});

	const [mode, setMode] = useState<"grid" | "list">("grid");

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

					<Group mt="xl">
						<PrimaryTitle>Connect to SurrealDB</PrimaryTitle>
						<Spacer />
						<TextInput
							// value={search}
							// onChange={setSearch}
							placeholder="Search connections"
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
						<ActionIcon.Group>
							<ActionIcon
								c={mode === "grid" ? "bright" : "slate.3"}
								onClick={() => setMode("grid")}
							>
								<Icon path={iconViewGrid} />
							</ActionIcon>
							<ActionIcon
								c={mode === "list" ? "bright" : "slate.3"}
								onClick={() => setMode("list")}
							>
								<Icon path={iconViewList} />
							</ActionIcon>
						</ActionIcon.Group>
					</Group>

					<SimpleGrid
						cols={{
							xs: 1,
							sm: 2,
							lg: 3,
						}}
					>
						<StartConnection connection={sandbox} />
						{userConnections.map((connection) => (
							<StartConnection
								key={connection.id}
								connection={connection}
							/>
						))}
						<StartCreator
							title="New connection"
							subtitle="Connect to a local or remote instance"
							onCreate={createConnection}
						/>
					</SimpleGrid>

					{cloudSections.map(({ organization, instances }) => (
						<Fragment key={organization.id}>
							<Group mt="lg">
								<Image
									src={cloudIconUrl}
									w={24}
								/>
								<Text
									fz="xl"
									fw={600}
									c="slate.0"
								>
									{organization.name} Cloud Instances
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

					<Divider my={24} />

					<PrimaryTitle>Surreal Cloud</PrimaryTitle>

					{authState !== "unauthenticated" ? (
						<Skeleton
							visible={authState !== "authenticated"}
							width="100%"
						>
							<SimpleGrid
								cols={{
									xs: 1,
									sm: 2,
								}}
							>
								<StartResource
									title="Manage Billing"
									subtitle="View and manage your billing information"
									icon={iconCreditCard}
									onClick={() => navigate("/billing")}
								/>
								<StartResource
									title="Referral Program"
									subtitle="Earn rewards for referring friends to Surreal Cloud"
									icon={iconReferral}
									onClick={() => navigate("/referrals")}
								/>
							</SimpleGrid>
						</Skeleton>
					) : (
						<StartAction
							title="Explore Surreal Cloud"
							subtitle="Surreal Cloud redefines the database experience, offering the power and flexibility of SurrealDB without the pain of managing infrastructure."
							icon={iconCloud}
							onClick={openCloudAuthentication}
							className={classes.cloudAction}
						>
							<Image
								src={splashUrl}
								className={classes.cloudImage}
							/>
						</StartAction>
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
		</Box>
	);
}
