import classes from "./style.module.scss";

import {
	iconBook,
	iconBug,
	iconChat,
	iconCloud,
	iconCommand,
	iconDiscord,
	iconEmail,
	iconQuery,
	iconSidekick,
	iconSurreal,
	iconSurrealist,
} from "~/util/icons";

import { Box, Divider, Group, Stack, UnstyledButton } from "@mantine/core";
import type { PropsWithChildren } from "react";
import { PrimaryTitle } from "../PrimaryTitle";
import { Spacer } from "../Spacer";
import { useIsLight } from "~/hooks/theme";
import { Text } from "@mantine/core";
import { Icon } from "../Icon";
import { adapter } from "~/adapter";
import { dispatchIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import clsx from "clsx";
import { useIsAuthenticated } from "~/hooks/cloud";

export interface HelpCenterProps {
	onBody?: boolean;
}

export function HelpCenter({ onBody }: HelpCenterProps) {
	const isAuthed = useIsAuthenticated();

	return (
		<Stack
			gap="xl"
			className={clsx(classes.root, onBody && classes.onBody)}
		>
			<HelpSection
				title="Community"
				description="Explore community resources for learning SurrealDB"
			>
				<Box
					w={182}
					h={182}
				/>
				<HelpTile
					title="Discord"
					description="Connect with other users and get help from the community."
					icon={iconDiscord}
					onClick={() => adapter.openUrl("https://discord.gg/dc4JNWrrMc")}
				/>
				<HelpTile
					title="Discourse"
					description="Join the SurrealDB community forum to discuss features, ask questions, and more."
					icon={iconChat}
					onClick={() => adapter.openUrl("https://community.surrealdb.com")}
				/>
			</HelpSection>
			<Divider />
			<HelpSection
				title="Surrealist"
				description="Learn more about Surrealist and how to use it"
			>
				<HelpTile
					title="Surrealist docs"
					description="Need help? Check out our documentation for help."
					icon={iconSurrealist}
					onClick={() => adapter.openUrl("https://surrealdb.com/docs/surrealist")}
				/>
				<HelpTile
					title="Keyboard shortcuts"
					description="Learn and configure available keyboard shortcuts."
					icon={iconCommand}
					onClick={() => dispatchIntent("open-settings", { tab: "keybindings" })}
				/>

				<HelpTile
					title="Report an issue"
					description="Something isn't working right? Let us know and we'll fix it."
					icon={iconBug}
					onClick={() =>
						adapter.openUrl("https://github.com/surrealdb/surrealist/issues")
					}
				/>
			</HelpSection>
			<Divider />
			<HelpSection
				title="Database"
				description="Need help learning SurrealDB? Check out these resources."
			>
				<HelpTile
					title="Documentation"
					description="Need help? Check out our documentation for help."
					icon={iconSurreal}
					noIconStroke
					onClick={() => adapter.openUrl("https://surrealdb.com/docs")}
				/>
				<HelpTile
					title="University"
					description="Learn more about SurrealDB and how to use it."
					icon={iconQuery}
					onClick={() => adapter.openUrl("https://surrealdb.com/learn/fundamentals")}
				/>
				<HelpTile
					title="Book"
					description="Read the SurrealDB book to learn more about databases."
					icon={iconBook}
					onClick={() => adapter.openUrl("https://surrealdb.com/learn/book")}
				/>
			</HelpSection>
			{isAuthed && (
				<>
					<Divider />
					<HelpSection
						title="Cloud"
						description="Explore support options for Surreal Cloud"
					>
						<HelpTile
							title="Cloud docs"
							description="Need help? Check out our documentation for help."
							icon={iconCloud}
							onClick={() => adapter.openUrl("https://surrealdb.com/docs/cloud")}
						/>
						<HelpTile
							title="Sidekick"
							description="Chat with Sidekick, your personal Surreal assistant."
							icon={iconSidekick}
							onClick={() => {
								const { setActiveView, setActiveCloudPage } =
									useConfigStore.getState();

								setActiveView("cloud");
								setActiveCloudPage("chat");
							}}
						/>
						<HelpTile
							title="Account support"
							description="Get in contact with our support team for help with your account."
							icon={iconEmail}
						/>
					</HelpSection>
				</>
			)}
		</Stack>
	);
}

interface HelpSectionProps {
	title: string;
	description: string;
}

function HelpSection({ title, description, children }: PropsWithChildren<HelpSectionProps>) {
	return (
		<Group
			align="start"
			wrap="nowrap"
			gap="xl"
		>
			<Box style={{ flexShrink: 1 }}>
				<PrimaryTitle>{title}</PrimaryTitle>
				<Text mt="xs">{description}</Text>
			</Box>
			<Spacer />
			{children}
		</Group>
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
			bg={isLight ? "slate.0" : "slate.9"}
			p="md"
			className={classes.helpTile}
			onClick={onClick}
		>
			<Icon
				path={icon}
				c="bright"
				size={1.75}
				noStroke={noIconStroke}
				mb="lg"
			/>
			<Text
				c="bright"
				fw={600}
				fz="lg"
				mb={4}
			>
				{title}
			</Text>
			<Text fz="sm">{description}</Text>
		</UnstyledButton>
	);
}
