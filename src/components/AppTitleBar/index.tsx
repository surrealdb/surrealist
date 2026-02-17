import { Box, Group, Image, Menu, Text } from "@mantine/core";
import {
	Icon,
	iconClose,
	iconMaximize,
	iconMinimize,
	iconRestore,
	pictoSurrealist,
} from "@surrealdb/ui";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import {
	Command,
	useCommandCategories,
	useCommandDispatcher,
	useCommandKeybinds,
} from "~/providers/Commands";
import { displayBinding } from "~/providers/Commands/keybindings";
import { useInterfaceStore } from "~/stores/interface";
import { ActionButton } from "../ActionButton";
import { getMenuItems } from "../App/hooks/menu";
import { Spacer } from "../Spacer";
import classes from "./style.module.scss";

export function AppTitleBar() {
	const keybinds = useCommandKeybinds();
	const currentWindow = getCurrentWindow();
	const cmdCategories = useCommandCategories();
	const dispatchCommand = useCommandDispatcher();
	const menuItems = getMenuItems();

	const { title } = useInterfaceStore.getState();
	const [isMaximized, setMaximized] = useState(false);

	const commands = cmdCategories.reduce((acc, category) => {
		for (const command of category.commands) {
			acc.set(command.id, command);
		}
		return acc;
	}, new Map<string, Command>());

	getCurrentWindow().onResized(() => {
		getCurrentWindow().isMaximized().then(setMaximized);
	});

	return (
		<Box className={classes.titleBar}>
			<Group gap={0}>
				<Image
					src={pictoSurrealist}
					w={23}
					m="md"
					data-tauri-drag-region
				/>
				{menuItems
					?.filter((it) => !it.disabled)
					.map((menu) => (
						<Menu
							key={menu.id}
							position="bottom-start"
						>
							<Menu.Target key={`${menu.id}-target`}>
								<Text
									size="md"
									className={classes.menuButton}
								>
									{menu.name}
								</Text>
							</Menu.Target>

							<Menu.Dropdown
								key={`${menu.id}-dropdown`}
								p="xs"
							>
								{menu.items.map((item, index) => {
									if (item.type === "Separator") {
										return <Menu.Divider key={index} />;
									}

									if (item.type === "Command") {
										const command = commands.get(item.id);
										const disabled = item.disabled || !command;

										return (
											<Menu.Item
												key={item.id}
												disabled={disabled}
												onClick={() => {
													dispatchCommand(item.id, item.data);
												}}
											>
												<Group gap={8}>
													{item.name}
													{keybinds.has(item.id) && (
														<>
															<Spacer />
															<Text c="obsidian.4">
																<Group
																	gap={2}
																	wrap="nowrap"
																>
																	{displayBinding(
																		keybinds.get(item.id) ?? [],
																	)}
																</Group>
															</Text>
														</>
													)}
												</Group>
											</Menu.Item>
										);
									}

									if (item.type === "Custom") {
										return (
											<Menu.Item
												key={item.id}
												disabled={item.disabled}
												onClick={item.action}
											>
												{item.name}
											</Menu.Item>
										);
									}
								})}
							</Menu.Dropdown>
						</Menu>
					))}
			</Group>

			<Box
				className={classes.dragArea}
				data-tauri-drag-region
			>
				<Text
					c="bright"
					fz="lg"
					fw={500}
					data-tauri-drag-region
				>
					{title}
				</Text>
			</Box>

			<Group
				gap={0}
				className={classes.windowControls}
			>
				<ActionButton
					label="Minimize"
					variant="subtle"
					color="gray"
					size="md"
					className={classes.controlButton}
					onClick={async () => {
						await getCurrentWindow().minimize();
					}}
				>
					<Icon path={iconMinimize} />
				</ActionButton>
				<ActionButton
					label={isMaximized ? "Restore" : "Maximize"}
					variant="subtle"
					color="gray"
					size="md"
					className={classes.controlButton}
					onClick={async () => {
						const maximized = await currentWindow.isMaximized();

						if (maximized) {
							await currentWindow.unmaximize();
							setMaximized(false);
						} else {
							await currentWindow.maximize();
							setMaximized(true);
						}
					}}
				>
					<Icon path={isMaximized ? iconRestore : iconMaximize} />
				</ActionButton>
				<ActionButton
					label="Close"
					variant="subtle"
					size="md"
					className={classes.closeButton}
					onClick={async () => {
						await getCurrentWindow().close();
					}}
				>
					<Icon path={iconClose} />
				</ActionButton>
			</Group>
		</Box>
	);
}
