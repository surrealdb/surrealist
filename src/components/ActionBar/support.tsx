import classes from "./style.module.scss";
import { Box, Group, Text, Title, Tooltip, UnstyledButton } from "@mantine/core";
import { ActionIcon, Modal, SimpleGrid } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { useIsAuthenticated } from "~/hooks/cloud";
import { useIsLight } from "~/hooks/theme";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { iconBook, iconBug, iconClose, iconCommand, iconDiscord, iconHelp } from "~/util/icons";

interface Topic {
	title: string;
	description: string;
	icon: string;
	onClick: () => void;
}

// const SUPPORT_CHAT: Topic = {
// 	title: "Support Chat",
// 	description: "Talk to our Surreal Chatbot for help on queries, Surrealist, and more.",
// 	icon: mdiChatOutline,
// 	onClick: () => {}
// };

const DOCUMENTATION: Topic = {
	title: "Documentation",
	description: "Need help? Check out our documentation for help.",
	icon: iconBook,
	onClick: () => adapter.openUrl("https://surrealdb.com/docs/surrealist")
};

const ISSUE_REPORT: Topic = {
	title: "Report an issue",
	description: "Something isn't working right? Let us know and we'll fix it.",
	icon: iconBug,
	onClick: () => adapter.openUrl("https://github.com/surrealdb/surrealist/issues")
};

const SHORTCUTS: Topic = {
	title: "Shortcut guide",
	description: "Learn the keyboard shortcuts to navigate the app faster.",
	icon: iconCommand,
	onClick: () => dispatchIntent("open-keymap")
};

const DISCORD: Topic = {
	title: "Discord",
	description: "Connect with other users and get help from the community.",
	icon: iconDiscord,
	onClick: () => adapter.openUrl("https://discord.gg/dc4JNWrrMc")
};

export function HelpAndSupport() {
	const [isOpen, openHandle] = useDisclosure();
	const isAuthed = useIsAuthenticated();
	const isLight = useIsLight();

	useIntent("open-help", openHandle.open);

	function renderRow(tile: Topic) {
		return (
			<UnstyledButton
				p="md"
				bg={isLight ? "slate.0" : "slate.9"}
				className={classes.helpRow}
				onClick={() => {
					tile.onClick();
					openHandle.close();
				}}
			>
				<Group wrap="nowrap">
					<Icon
						path={tile.icon}
						c="bright"
						size="xl"
						mb="sm"
						mx="sm"
					/>
					<Box>
						<Text
							c="bright"
							fw={600}
							fz="lg"
							mb={4}
						>
							{tile.title}
						</Text>
						<Text fz="sm">
							{tile.description}
						</Text>
					</Box>
				</Group>
			</UnstyledButton>
		);
	}

	function renderTile(tile: Topic) {
		return (
			<UnstyledButton
				bg={isLight ? "slate.0" : "slate.9"}
				p="md"
				className={classes.helpTile}
				onClick={() => {
					tile.onClick();
					openHandle.close();
				}}
			>
				<Icon
					path={tile.icon}
					c="bright"
					size="xl"
					mb="sm"
				/>
				<Text
					c="bright"
					fw={600}
					fz="lg"
					mb={4}
				>
					{tile.title}
				</Text>
				<Text fz="sm">
					{tile.description}
				</Text>
			</UnstyledButton>
		);
	}

	return (
		<>
			<Tooltip label="Help and support">
				<ActionIcon
					w={36}
					h={36}
					radius="md"
					onClick={openHandle.toggle}
					variant="subtle"
					aria-label="Open Help and support"
				>
					<Icon path={iconHelp} size="lg" />
				</ActionIcon>
			</Tooltip>

			<Modal
				opened={isOpen}
				onClose={openHandle.close}
				ta="center"
				size="sm"
			>
				<Title fz={20} c="bright">
					How can we help you?
				</Title>

				<ActionIcon
					pos="absolute"
					top={20}
					right={20}
					onClick={openHandle.close}
					aria-label="Close modal"
				>
					<Icon path={iconClose} />
				</ActionIcon>

				<SimpleGrid cols={2} mt="xl">
					{renderTile(DOCUMENTATION)}
					{renderTile(ISSUE_REPORT)}
					{renderTile(SHORTCUTS)}
					{renderTile(DISCORD)}
				</SimpleGrid>
			</Modal>
		</>
	);
}
