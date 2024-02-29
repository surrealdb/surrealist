import classes from "./style.module.scss";
import { Text, Title, UnstyledButton } from "@mantine/core";
import { ActionIcon, Modal, SimpleGrid } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { mdiBook, mdiBug, mdiChat, mdiRoutes } from "@mdi/js";
import { Icon } from "~/components/Icon";
import { useIsLight } from "~/hooks/theme";
import { iconClose, iconHelp } from "~/util/icons";

const TILES = [
	{
		title: "Documentation",
		description: "Need help? Check out our documentation for help.",
		icon: mdiBook
	},
	{
		title: "Report an issue",
		description: "Something isn't working right? Let us know and we'll fix it.",
		icon: mdiBug
	},
	{
		title: "Feedback",
		description: "Have a suggestion or feedback? We'd love to hear it.",
		icon: mdiChat
	},
	{
		title: "Restart the tour",
		description: "Need to restart the tour? Click here to start over.",
		icon: mdiRoutes
	}
];

export function HelpAndSupport() {
	const [isOpen, openHandle] = useDisclosure();
	const isLight = useIsLight();

	return (
		<>
			<ActionIcon
				size="xl"
				title="Help & Support"
				onClick={openHandle.toggle}
			>
				<Icon path={iconHelp} />
			</ActionIcon>

			<Modal
				opened={isOpen}
				onClose={openHandle.close}
				ta="center"
			>
				<Title fz={20} c="bright">
					How can we help you?
				</Title>

				<ActionIcon
					pos="absolute"
					top={20}
					right={20}
					onClick={openHandle.close}
				>
					<Icon path={iconClose} />
				</ActionIcon>

				<SimpleGrid cols={2} mt="xl">
					{TILES.map((tile, i) => (
						<UnstyledButton
							key={i}
							className={classes.tile}
							bg={isLight ? "slate.0" : "slate.9"}
							p="lg"
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