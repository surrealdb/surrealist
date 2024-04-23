import classes from "../style.module.scss";
import {
	Box,
	Divider,
	Group,
	Modal,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	UnstyledButton,
} from "@mantine/core";
import { useConnection } from "~/hooks/connection";
import { Y_SLIDE_TRANSITION, fuzzyMatch } from "~/util/helpers";
import { Icon } from "~/components/Icon";
import { iconOpen, iconServer } from "~/util/icons";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Command, CommandCategory, computeCommands } from "~/util/commands";
import { useInputState } from "@mantine/hooks";
import { useConfigStore } from "~/stores/config";
import { useStable } from "~/hooks/stable";
import { adapter } from "~/adapter";
import { Spacer } from "~/components/Spacer";
import { Shortcut } from "~/components/Shortcut";
import { dispatchIntent } from "~/hooks/url";

export interface CommandPaletteModalProps {
	opened: boolean;
	onClose: () => void;
}

export function CommandPaletteModal({
	opened,
	onClose,
}: CommandPaletteModalProps) {
	const { pushCommand } = useConfigStore.getState();

	const connection = useConnection();
	const ref = useRef<HTMLDivElement>(null);

	const [search, setSearch] = useInputState("");
	const [selected, setSelected] = useState<Command | null>(null);
	const [categories, setCategories] = useState<CommandCategory[]>([]);

	useLayoutEffect(() => {
		if (opened) {
			const cmds = computeCommands();

			setSearch("");
			setCategories(cmds);
			setSelected(cmds[0]?.commands[0] ?? null);
		}
	}, [opened]);

	const [filtered, flattened] = useMemo(() => {
		const filtered = categories.flatMap((cat) => {
			if (search && cat.search === false) {
				return [];
			}

			const commands = fuzzyMatch(search, cat.name)
				? cat.commands
				: cat.commands.filter(
					(cmd) =>
						fuzzyMatch(search, cmd.name) ||
							cmd.aliases?.find((alias) =>
								fuzzyMatch(search, alias)
							)
				);

			return commands.length === 0
				? []
				: [
					{
						...cat,
						commands,
					},
				];
		});

		const flattened = filtered.flatMap((cat) => cat.commands);

		return [filtered, flattened];
	}, [categories, search]);

	useLayoutEffect(() => {
		if (
			flattened.length > 0 &&
			(!selected || !flattened.includes(selected))
		) {
			setSelected(flattened[0]);
		}
	}, [flattened]);

	const activate = (cmd: Command) => {
		switch (cmd.action.type) {
			case "insert": {
				setSearch(cmd.action.content);
				break;
			}
			case "href": {
				onClose();
				adapter.openUrl(cmd.action.href);
				break;
			}
			case "intent": {
				onClose();
				dispatchIntent(cmd.action.intent, cmd.action.payload);
				break;
			}
			case "launch": {
				const query = search.trim();

				if (query.length > 0) {
					pushCommand(query);
				}

				onClose();
				cmd.action.handler();
				break;
			}
		}
	};

	const handleKeyDown = useStable((e: React.KeyboardEvent) => {
		if (e.key === "Enter" && selected) {
			activate(selected);
			return;
		}

		if (selected) {
			let target: Command | undefined;

			if (e.key == "ArrowDown" || (e.key == "Tab" && !e.shiftKey)) {
				target =
					flattened[flattened.indexOf(selected) + 1] ?? flattened[0];
			} else if (e.key == "ArrowUp" || (e.key == "Tab" && e.shiftKey)) {
				target =
					flattened[flattened.indexOf(selected) - 1] ??
					flattened.at(-1);
			}

			if (target) {
				setSelected(target);

				ref.current
					?.querySelector(`[data-cmd="${target.id}"]`)
					?.scrollIntoView({
						block: "nearest",
					});

				e.stopPropagation();
				e.preventDefault();
			}
		}
	});

	return (
		<Modal
			opened={opened}
			onClose={onClose}
			transitionProps={{ transition: Y_SLIDE_TRANSITION }}
			centered={false}
			size="lg"
			onKeyDown={handleKeyDown}
			classNames={{
				content: classes.paletteModal,
				body: classes.paletteBody,
			}}
		>
			<Box>
				{connection && (
					<Group gap="xs" mb="sm" c="surreal">
						<Icon path={iconServer} size="sm" />
						<Text>In {connection.name}</Text>
					</Group>
				)}
				<TextInput
					flex={1}
					placeholder="What would you like to do?"
					variant="unstyled"
					className={classes.paletteInput}
					autoFocus
					value={search}
					onChange={setSearch}
				/>
			</Box>

			<Divider color="slate.6" my="lg" />

			<Box h={350} pb={0}>
				<ScrollArea viewportRef={ref} scrollbars="y" h="100%">
					{filtered.length > 0 ? (
						<Stack pb="xl">
							{filtered.map((cat) => (
								<Box key={cat.name}>
									<Text c="slate" fw={500}>
										{cat.name}
									</Text>
									<Stack mt="xs" gap={2}>
										{cat.commands.map((cmd) => (
											<UnstyledButton
												key={cmd.name}
												onClick={() => activate(cmd)}
												onMouseMove={() =>
													setSelected(cmd)
												}
												className={classes.command}
												data-active={selected === cmd}
												data-cmd={cmd.id}
											>
												<Icon
													path={cmd.icon}
													className={
														classes.commandIcon
													}
												/>
												<Text
													className={
														classes.commandLabel
													}
												>
													{cmd.name}
												</Text>
												{cmd.action.type == "href" && (
													<Icon
														path={iconOpen}
														className={
															classes.commandIcon
														}
														size="sm"
														ml={-8}
													/>
												)}
												{cmd.shortcut && (
													<>
														<Spacer />
														<Group gap="lg">
															{(Array.isArray(
																cmd.shortcut
															)
																? cmd.shortcut
																: [cmd.shortcut]
															).map(
																(
																	shortcut,
																	i
																) => (
																	<Shortcut
																		key={i}
																		value={
																			shortcut
																		}
																	/>
																)
															)}
														</Group>
													</>
												)}
											</UnstyledButton>
										))}
									</Stack>
								</Box>
							))}
						</Stack>
					) : (
						<Text ta="center" py="md" c="slate">
							No matching commands found
						</Text>
					)}
				</ScrollArea>
			</Box>
		</Modal>
	);
}
