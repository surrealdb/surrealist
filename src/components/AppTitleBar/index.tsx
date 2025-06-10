import { ActionIcon, Box, Group, Image, Menu, Text } from "@mantine/core";
import { invoke } from "@tauri-apps/api/core";
import { Icon } from "~/components/Icon";
import { iconClose, iconTextBox, iconTextBoxMinus } from "~/util/icons";
import { dispatchIntent } from "~/util/intents";
import icon from "~/assets/images/icon.webp";
import classes from "./style.module.scss";

export function AppTitleBar() {
	return (
		<Box className={classes.titleBar}>
			<Group gap={0}>
				<Image
					src={icon}
					h={12}
					m="md"
					data-tauri-drag-region
				/>
				<Menu>
					<Menu.Target>
						<Text
							size="md"
							className={classes.menuButton}
						>
							File
						</Text>
					</Menu.Target>
					<Menu.Dropdown p="xs">
						<Menu.Item
							onClick={async () => {
								await invoke("new_window");
							}}
						>
							New Window
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item
							onClick={() => {
								dispatchIntent("open-settings", { tab: "preferences" });
							}}
						>
							Settings
						</Menu.Item>
						<Menu.Divider />
						<Menu.Item
							onClick={async () => {
								await invoke("close_window");
							}}
						>
							Close Window
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>

				<Menu>
					<Menu.Target>
						<Text className={classes.menuButton}>Help</Text>
					</Menu.Target>
					<Menu.Dropdown p="xs">
						<Menu.Label>Community</Menu.Label>
						<Menu.Item
							component="a"
							target="_blank"
							href="https://discord.gg/dc4JNWrrMc"
						>
							Discord
						</Menu.Item>
						<Menu.Item
							component="a"
							target="_blank"
							href="https://github.com/surrealdb"
						>
							GitHub
						</Menu.Item>
						<Menu.Item
							component="a"
							target="_blank"
							href="https://youtube.com/@SurrealDB"
						>
							YouTube
						</Menu.Item>

						<Menu.Label mt={8}>Documentation</Menu.Label>
						<Menu.Item
							component="a"
							target="_blank"
							href="https://surrealdb.com/docs/surrealdb"
						>
							SurrealDB docs
						</Menu.Item>
						<Menu.Item
							component="a"
							target="_blank"
							href="https://surrealdb.com/docs/surrealist"
						>
							Surrealist docs
						</Menu.Item>

						<Menu.Label mt={8}>University</Menu.Label>
						<Menu.Item
							component="a"
							target="_blank"
							href="https://surrealdb.com/learn/fundamentals"
						>
							Fundamentals course
						</Menu.Item>
						<Menu.Item
							component="a"
							target="_blank"
							href="https://surrealdb.com/learn/book"
						>
							Book
						</Menu.Item>

						<Menu.Divider />
						<Menu.Item
							component="a"
							target="_blank"
							href="https://github.com/surrealdb/surrealist/issues/new/choose"
						>
							Report an issue
						</Menu.Item>
						<Menu.Item
							onClick={() => {
								dispatchIntent("open-settings", { tab: "about" });
							}}
						>
							About Surrealist
						</Menu.Item>
					</Menu.Dropdown>
				</Menu>
			</Group>

			<Box
				className={classes.dragArea}
				data-tauri-drag-region
			>
				<Text
					c="bright"
					fz="lg"
					fw={600}
					data-tauri-drag-region
				>
					{document.title}
				</Text>
			</Box>

			<Group
				gap={0}
				className={classes.windowControls}
			>
				<ActionIcon
					aria-label="Minimize"
					variant="subtle"
					color="gray"
					size="md"
					className={classes.controlButton}
					onClick={async () => {
						await invoke("minimize_window");
					}}
				>
					<Icon path={iconTextBoxMinus} />
				</ActionIcon>
				<ActionIcon
					aria-label="Maximize"
					variant="subtle"
					color="gray"
					size="md"
					className={classes.controlButton}
					onClick={async () => {
						await invoke("maximize_window");
					}}
				>
					<Icon path={iconTextBox} />
				</ActionIcon>
				<ActionIcon
					aria-label="Close"
					variant="subtle"
					size="md"
					className={classes.closeButton}
					onClick={async () => {
						await invoke("close_window");
					}}
				>
					<Icon path={iconClose} />
				</ActionIcon>
			</Group>
		</Box>
	);
}
