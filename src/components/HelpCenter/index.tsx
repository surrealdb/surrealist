import classes from "./style.module.scss";

import {
	iconAPI,
	iconBook,
	iconBug,
	iconCloud,
	iconCommand,
	iconDiscord,
	iconEmail,
	iconQuery,
	iconSidekick,
	iconSurreal,
	iconSurrealist,
	iconVideo,
} from "~/util/icons";

import { Box, SimpleGrid, Stack, UnstyledButton } from "@mantine/core";
import { Text } from "@mantine/core";
import { closeAllModals } from "@mantine/modals";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { useLocation } from "wouter";
import { adapter } from "~/adapter";
import { useIsAuthenticated, useSurrealCloud } from "~/hooks/cloud";
import { useIsLight } from "~/hooks/theme";
import { openAccountSupport } from "~/screens/cloud-panel/modals/account-support";
import { dispatchIntent } from "~/util/intents";
import { Icon } from "../Icon";
import { PrimaryTitle } from "../PrimaryTitle";

export interface HelpCenterProps {
	onBody?: boolean;
}

export function HelpCenter({ onBody }: HelpCenterProps) {
	const isAuthed = useIsAuthenticated();
	const showCloud = useSurrealCloud();

	const [, navigate] = useLocation();

	return (
		<Stack
			gap={32}
			className={clsx(classes.root, onBody && classes.onBody)}
		>
			<HelpSection title="Community">
				<HelpTile
					title="Discord"
					description="Join our active community for ideas, discussions, and support"
					icon={iconDiscord}
					onClick={() => adapter.openUrl("https://discord.gg/dc4JNWrrMc")}
				/>
				<HelpTile
					title="GitHub"
					description="Star the SurrealDB project and keep up-to-date with development"
					icon={iconAPI}
					onClick={() => adapter.openUrl("https://github.com/surrealdb")}
				/>
				<HelpTile
					title="YouTube"
					description="Stay up-to-date with live streams & video tutorials"
					icon={iconVideo}
					onClick={() => adapter.openUrl("https://www.youtube.com/@SurrealDB")}
				/>
			</HelpSection>
			<HelpSection title="Surrealist">
				<HelpTile
					title="Surrealist docs"
					description="Learn how to use and navigate the Surrealist user interface"
					icon={iconSurrealist}
					onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealist")}
				/>
				<HelpTile
					title="Keyboard shortcuts"
					description="Improve productivity and speed up tasks through configurable shortcuts"
					icon={iconCommand}
					onClick={() => dispatchIntent("open-settings", { tab: "keybindings" })}
				/>

				<HelpTile
					title="Issue or feature request"
					description="Report bugs or submit a feature request by creating a GitHub issue"
					icon={iconBug}
					onClick={() =>
						adapter.openUrl("https://github.com/surrealdb/surrealist/issues")
					}
				/>
			</HelpSection>
			<HelpSection title="Database">
				<HelpTile
					title="Database docs"
					description="Get started with SurrealDB with examples, guides and tutorials"
					icon={iconSurreal}
					noIconStroke
					onClick={() => adapter.openUrl("https://surrealdb.com/docs")}
				/>
				<HelpTile
					title="University"
					description="Learn the fundamentals of SurrealDB in as little as 3 hours"
					icon={iconQuery}
					onClick={() => adapter.openUrl("https://surrealdb.com/learn/fundamentals")}
				/>
				<HelpTile
					title="Book"
					description="Become an expert in SurrealQL through Aeon's Surreal Renaissance"
					icon={iconBook}
					onClick={() => adapter.openUrl("https://surrealdb.com/learn/book")}
				/>
			</HelpSection>
			{showCloud && (
				<HelpSection title="Cloud">
					<HelpTile
						title="Cloud docs"
						description="Learn how to set-up, configure, and manage your instances and teams"
						icon={iconCloud}
						onClick={() => adapter.openUrl("https://surrealdb.com/docs/cloud")}
					/>
					<HelpTile
						title="Sidekick"
						description="Chat with and get support from your personal Surreal AI assistant"
						icon={iconSidekick}
						onClick={() => navigate("/cloud/chat")}
					/>
					<HelpTile
						title="Account"
						description="Account or billing related issue? Raise a support ticket"
						icon={iconEmail}
						onClick={() => {
							if (isAuthed) {
								openAccountSupport();
							} else {
								navigate("cloud");
							}
						}}
					/>
				</HelpSection>
			)}
		</Stack>
	);
}

interface HelpSectionProps {
	title: string;
}

function HelpSection({ title, children }: PropsWithChildren<HelpSectionProps>) {
	return (
		<Box>
			<PrimaryTitle>{title}</PrimaryTitle>
			<SimpleGrid
				mt="md"
				cols={{
					base: 1,
					lg: 3,
				}}
			>
				{children}
			</SimpleGrid>
		</Box>
	);
}

interface HelpTileProps {
	title: string;
	description: string;
	icon: string;
	noIconStroke?: boolean;
	onClick?: () => void;
}

function HelpTile({ title, description, icon, noIconStroke, onClick }: HelpTileProps) {
	const isLight = useIsLight();

	return (
		<UnstyledButton
			p="lg"
			bg={isLight ? "slate.0" : "slate.9"}
			className={classes.helpTile}
			onClick={() => {
				closeAllModals();
				onClick?.();
			}}
		>
			<Icon
				path={icon}
				c="bright"
				size="lg"
				noStroke={noIconStroke}
				mb="lg"
				mr="md"
			/>
			<Box>
				<Text
					c="bright"
					fw={600}
					fz="lg"
					mt={1}
				>
					{title}
				</Text>
				<Text
					fz="sm"
					mt="xs"
				>
					{description}
				</Text>
			</Box>
		</UnstyledButton>
	);
}
