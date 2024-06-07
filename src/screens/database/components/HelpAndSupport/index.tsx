import classes from "./style.module.scss";
import { Text, Title, Tooltip, UnstyledButton } from "@mantine/core";
import { ActionIcon, Modal, SimpleGrid } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { mdiAppleKeyboardCommand } from "@mdi/js";
import { adapter } from "~/adapter";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { iconBook, iconBug, iconClose, iconHelp } from "~/util/icons";

const TILES = [
	{
		title: "Documentation",
		description: "Need help? Check out our documentation for help.",
		icon: iconBook,
		onClick: () => adapter.openUrl("https://surrealdb.com/docs/surrealist")
	},
	{
		title: "Report an issue",
		description: "Something isn't working right? Let us know and we'll fix it.",
		icon: iconBug,
		onClick: () => adapter.openUrl("https://github.com/surrealdb/surrealist/issues")
	},
	{
		title: "Shortcuts",
		description: "Learn the keyboard shortcuts to navigate the app faster",
		icon: mdiAppleKeyboardCommand,
		onClick: () => dispatchIntent("open-keymap")
	},
	// {
	// 	title: "Restart the tour",
	// 	description: "Need to restart the tour? Click here to start over.",
	// 	icon: iconRoutes,
	// 	onClick: () => {}
	// }
];

export function HelpAndSupport() {
	const [isOpen, openHandle] = useDisclosure();
	const isLight = useIsLight();

	useIntent("open-help", openHandle.open);

	return (
		<>
			<Tooltip label="Help and support">
				<ActionIcon
					w={36}
					h={36}
					onClick={openHandle.toggle}
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
					{TILES.map((tile, i) => (
						<UnstyledButton
							key={i}
							bg={isLight ? "slate.0" : "slate.9"}
							p="md"
							className={classes.tile}
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
					))}
				</SimpleGrid>
			</Modal>
		</>
	);
}
