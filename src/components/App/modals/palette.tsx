import classes from "../style.module.scss";

import { Box, Divider, Group, Modal, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import clsx from "clsx";
import posthog from "posthog-js";
import { useMemo, useRef, useState } from "react";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { PreferenceInput } from "~/components/Inputs/preference";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useKeymap } from "~/hooks/keymap";
import { useKeyNavigation } from "~/hooks/keys";
import { useStable } from "~/hooks/stable";
import { dispatchIntent, useIntent } from "~/hooks/url";
import { useConfigStore } from "~/stores/config";
import { type Command, type CommandCategory, computeCommands } from "~/util/commands";
import { Y_SLIDE_TRANSITION, fuzzyMatch } from "~/util/helpers";
import { iconOpen, iconSearch } from "~/util/icons";

export function CommandPaletteModal() {
	const { pushCommand } = useConfigStore.getState();
	const searchRef = useRef<HTMLInputElement>(null);

	const [isOpen, openHandle] = useBoolean();
	const [search, setSearch] = useInputState("");
	const [categories, setCategories] = useState<CommandCategory[]>([]);

	const [filtered, flattened] = useMemo(() => {
		const filtered = categories.flatMap((cat) => {
			if (
				(cat.visibility === "unsearched" && search) ||
				(cat.visibility === "searched" && !search)
			) {
				return [];
			}

			const commands = fuzzyMatch(search, cat.name)
				? cat.commands
				: cat.commands.filter(
						(cmd) =>
							fuzzyMatch(search, cmd.name) ||
							cmd.aliases?.find((alias) => fuzzyMatch(search, alias)),
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

	const activate = useStable((cmd: Command) => {
		const query = search.trim();

		posthog.capture("execute_command", {
			command: cmd.name,
		});

		switch (cmd.action.type) {
			case "insert": {
				setSearch(cmd.action.content);
				searchRef.current?.focus();
				break;
			}
			case "href": {
				openHandle.close();
				adapter.openUrl(cmd.action.href);
				break;
			}
			case "intent": {
				openHandle.close();
				dispatchIntent(cmd.action.intent, cmd.action.payload);
				break;
			}
			case "launch": {
				openHandle.close();
				cmd.action.handler();
				break;
			}
			case "preference": {
				const el = document.querySelector(`[data-navigation-item-id="${cmd.id}"]`);
				const input = el?.querySelector(".mantine-Checkbox-root input");

				(input as HTMLElement)?.click();
				return;
			}
		}

		if (query.length > 0) {
			pushCommand(query);
		}
	});

	const [handleKeyDown, selected] = useKeyNavigation(flattened, activate);

	useIntent("open-command-palette", () => {
		openHandle.open();

		setSearch("");
		setCategories(computeCommands());
	});

	useKeymap([
		[
			"mod+k",
			(e) => {
				// NOTE - Fix #479, needs long term solution
				if (e.ctrlKey && adapter.platform === "darwin") return;

				dispatchIntent("open-command-palette");
			},
		],
	]);

	return (
		<Modal
			opened={isOpen}
			onClose={openHandle.close}
			transitionProps={{ transition: Y_SLIDE_TRANSITION }}
			centered={false}
			size="lg"
			onKeyDown={handleKeyDown}
			classNames={{
				content: classes.listingModal,
				body: classes.listingBody,
			}}
		>
			<Box p="lg">
				<Group
					mb="xs"
					gap="xs"
					c="bright"
				>
					<Icon
						path={iconSearch}
						size="sm"
					/>
					<Text>Surrealist Search</Text>
				</Group>
				<TextInput
					flex={1}
					placeholder="What would you like to do?"
					variant="unstyled"
					className={classes.listingSearch}
					ref={searchRef}
					autoFocus
					value={search}
					spellCheck={false}
					onChange={setSearch}
				/>
			</Box>

			<Divider mx="lg" />

			<ScrollArea.Autosize
				scrollbars="y"
				mah="calc(100vh - 200px)"
			>
				{filtered.length > 0 ? (
					<Stack p="lg">
						{filtered.map((cat) => (
							<Box key={cat.name}>
								<Text
									c="slate"
									fw={500}
								>
									{cat.name}
								</Text>
								<Stack
									mt="xs"
									gap={2}
								>
									{cat.commands.map((cmd) => (
										<Entry
											key={cmd.id}
											onClick={() => activate(cmd)}
											disabled={cmd.disabled}
											leftSection={<Icon path={cmd.icon} />}
											data-navigation-item-id={cmd.id}
											className={clsx(
												selected === cmd.id && classes.listingActive,
											)}
										>
											<Text>{cmd.name}</Text>
											{cmd.action.type === "href" && (
												<Icon
													path={iconOpen}
													size="sm"
													ml={-8}
												/>
											)}
											{cmd.shortcut && (
												<>
													<Spacer />
													<Group gap="lg">
														{(Array.isArray(cmd.shortcut)
															? cmd.shortcut
															: [cmd.shortcut]
														).map((shortcut, i) => (
															<Shortcut
																key={i}
																value={shortcut}
															/>
														))}
													</Group>
												</>
											)}
											{cmd.action.type === "preference" && (
												<>
													<Spacer />
													<PreferenceInput
														controller={cmd.action.controller}
													/>
												</>
											)}
										</Entry>
									))}
								</Stack>
							</Box>
						))}
					</Stack>
				) : (
					<Text
						ta="center"
						py="md"
						c="slate"
						my="xl"
					>
						No matching commands found
					</Text>
				)}
			</ScrollArea.Autosize>
		</Modal>
	);
}
