import classes from "../style.module.scss";

import { Box, Divider, Group, Modal, ScrollArea, Stack, Text, TextInput } from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import clsx from "clsx";
import posthog from "posthog-js";
import { type KeyboardEvent, useMemo, useRef } from "react";
import { adapter } from "~/adapter";
import { Entry } from "~/components/Entry";
import { Icon } from "~/components/Icon";
import { PreferenceInput } from "~/components/Inputs/preference";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useKeyNavigation } from "~/hooks/keys";
import { useStable } from "~/hooks/stable";
import { dispatchIntent, useIntent } from "~/hooks/url";
import {
	type Command,
	useCommandCategories,
	useCommandDispatcher,
	useCommandKeybinds,
} from "~/providers/Commands";
import { useConfigStore } from "~/stores/config";
import { ON_STOP_PROPAGATION, Y_SLIDE_TRANSITION, fuzzyMatch } from "~/util/helpers";
import { iconOpen, iconSearch } from "~/util/icons";

export function CommandPaletteModal() {
	const { pushCommand } = useConfigStore.getState();
	const searchRef = useRef<HTMLInputElement>(null);

	const [isOpen, openHandle] = useBoolean();
	const [search, setSearch] = useInputState("");

	const dispatch = useCommandDispatcher();
	const categories = useCommandCategories();
	const keybinds = useCommandKeybinds();

	const handlePreferenceInput = useStable((e: KeyboardEvent) => {
		e.stopPropagation();

		if (e.code === "Tab") {
			e.preventDefault();
			return;
		}

		if (e.code === "Escape") {
			searchRef.current?.focus();
			openHandle.open();
		}
	});

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

		switch (cmd.action.type) {
			case "insert": {
				setSearch(cmd.action.content);
				searchRef.current?.focus();
				break;
			}
			case "preference": {
				const el = document.querySelector(`[data-navigation-item-id="${cmd.id}"]`);
				const input = el?.querySelector<HTMLElement>(".mantine-InputWrapper-root input");
				const checkbox = el?.querySelector<HTMLElement>(".mantine-Checkbox-root input");

				(input ?? checkbox)?.click();
				input?.focus();
				return;
			}
			default: {
				dispatch(cmd.id);
				openHandle.close();
				break;
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
	});

	// useKeymap([
	// 	[
	// 		"mod+k",
	// 		(e) => {
	// 			// NOTE - Fix #479, needs long term solution
	// 			if (e.ctrlKey && adapter.platform === "darwin") return;

	// 			dispatchIntent("open-command-palette");
	// 		},
	// 	],
	// ]);

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
											{keybinds.has(cmd.id) && (
												<>
													<Spacer />
													<Shortcut value={keybinds.get(cmd.id) ?? []} />
												</>
											)}
											{cmd.action.type === "preference" && (
												<>
													<Spacer />
													<Box
														onClick={ON_STOP_PROPAGATION}
														onKeyDown={handlePreferenceInput}
													>
														<PreferenceInput
															controller={cmd.action.controller}
															compact
														/>
													</Box>
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
