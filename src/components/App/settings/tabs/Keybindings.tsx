import {
	Box,
	Button,
	Divider,
	Group,
	Modal,
	Paper,
	ScrollArea,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useInputState } from "@mantine/hooks";
import { Icon, iconEdit, iconPlus, iconSearch } from "@surrealdb/ui";
import equal from "fast-deep-equal";
import { Fragment, useMemo, useState } from "react";
import { ActionButton } from "~/components/ActionButton";
import { KeybindInput } from "~/components/Inputs/keybinding";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useStable } from "~/hooks/stable";
import {
	type Command,
	useCommandCategories,
	useCommandKeybinds,
	useCommandRegistry,
} from "~/providers/Commands";
import { useConfigStore } from "~/stores/config";
import { fuzzyMatch } from "~/util/helpers";

export function KeybindingsTab() {
	const [search, setSearch] = useInputState("");
	const userKeybinds = useConfigStore((state) => state.keybindings);
	const categories = useCommandCategories();
	const commands = useCommandRegistry();
	const keybinds = useCommandKeybinds();

	const [isRecording, recordingHandle] = useBoolean();
	const [recordCommand, setRecordCommand] = useState<Command | null>(null);

	const filtered = useMemo(() => {
		return categories.flatMap((category) => {
			const commands = category.commands.filter((cmd) => {
				return (
					cmd.binding &&
					(fuzzyMatch(search, cmd.name) ||
						cmd.aliases?.some((alias) => fuzzyMatch(search, alias)))
				);
			});

			if (commands.length === 0) {
				return [];
			}

			return [{ ...category, commands }];
		});
	}, [categories, search]);

	return (
		<>
			<ScrollArea
				pr="xl"
				flex={1}
				scrollbars="y"
				type="always"
			>
				<Box m="xs">
					<TextInput
						leftSection={
							<Icon
								path={iconSearch}
								size="sm"
							/>
						}
						placeholder="Search commands"
						value={search}
						onChange={setSearch}
						autoFocus
						size="xs"
						mb="sm"
					/>
					<Stack
						gap="xl"
						mt="xl"
						pb={32}
					>
						{filtered.length === 0 && (
							<Text
								ta="center"
								c="obsidian"
								mt="xl"
							>
								No results matched your search
							</Text>
						)}
						{filtered.map((category, i) => (
							<Box key={i}>
								<Text
									fw={600}
									fz={20}
									c="bright"
								>
									{category.name}
								</Text>
								<Stack
									mt="lg"
									gap="xs"
								>
									{category.commands.map((cmd, j) => {
										const active = keybinds.get(cmd.id);
										const modified = userKeybinds[cmd.id] !== undefined;

										return (
											<Fragment key={j}>
												<Group h={42}>
													<Icon
														path={cmd.icon}
														size="sm"
													/>
													<Text c="bright">{cmd.name}</Text>
													{modified && (
														<Text c="obsidian">(Modified)</Text>
													)}
													<Spacer />
													{active && active.length > 0 ? (
														<Shortcut value={active} />
													) : (
														<Text c="obsidian">&mdash;</Text>
													)}
													<ActionButton
														ml="xl"
														variant="subtle"
														label={
															active
																? "Edit keybinding"
																: "Add keybinding"
														}
														onClick={() => {
															setRecordCommand(cmd);
															recordingHandle.open();
														}}
													>
														<Icon path={active ? iconEdit : iconPlus} />
													</ActionButton>
												</Group>
												{j < category.commands.length - 1 && <Divider />}
											</Fragment>
										);
									})}
								</Stack>
							</Box>
						))}
					</Stack>
				</Box>
			</ScrollArea>

			<Modal
				opened={isRecording}
				onClose={recordingHandle.close}
			>
				{recordCommand && (
					<RecordingModal
						command={recordCommand}
						commands={commands}
						keybindMap={keybinds}
						onClose={recordingHandle.close}
					/>
				)}
			</Modal>
		</>
	);
}

interface RecordingModalProps {
	command: Command;
	commands: Map<string, Command>;
	keybindMap: Map<string, string[]>;
	onClose: () => void;
}

function RecordingModal({ command, commands, keybindMap, onClose }: RecordingModalProps) {
	const { setKeybinding, removeKeybinding } = useConfigStore.getState();

	const [binding, setBinding] = useState<string[]>([]);
	const active = keybindMap.get(command.id);
	const hasOldBinding = active && active.length > 0;
	const isResettable = active && !equal(active, command.binding);

	const duplicates = Array.from(
		keybindMap
			.entries()
			.filter(([id, bind]) => {
				return id !== command.id && equal(bind, binding);
			})
			.map(([id]) => id),
	);

	const handleReset = useStable(() => {
		removeKeybinding(command.id);
		onClose();
	});

	const handleSave = useStable(() => {
		const defaultBind = command.binding === true ? [] : command.binding;

		if (equal(binding, defaultBind)) {
			removeKeybinding(command.id);
		} else {
			setKeybinding(command.id, binding);
		}

		onClose();
	});

	return (
		<Stack>
			<Box>
				<Group gap="xs">
					<Icon
						path={command.icon}
						size="sm"
					/>
					<Text fz="sm">{command.name}</Text>
				</Group>
				<PrimaryTitle
					mt="xs"
					fw={500}
					c="bright"
					fz="lg"
				>
					Enter your desired keybinding
				</PrimaryTitle>
				{hasOldBinding && (
					<Group
						gap="xs"
						mt="sm"
					>
						<Text>Currently bound to</Text>
						<Shortcut value={active ?? []} />
					</Group>
				)}
			</Box>
			<Box>
				<KeybindInput
					mt="sm"
					autoFocus
					value={binding}
					onChange={setBinding}
					placeholder="Listening for input..."
				/>
			</Box>
			{duplicates.length > 0 && (
				<Paper
					bg="obsidian.9"
					mt="sm"
					p="lg"
				>
					<Text
						mb="xs"
						c="bright"
						fw={500}
					>
						Conflicting keybindings
					</Text>
					{duplicates.map((cmd) => {
						const options = commands.get(cmd);

						return (
							options && (
								<Group
									mt={2}
									gap="xs"
									key={cmd}
								>
									<Icon
										path={options.icon ?? ""}
										size="sm"
									/>
									<Text>{options.name}</Text>
								</Group>
							)
						);
					})}
				</Paper>
			)}
			<Group mt="lg">
				<Button
					onClick={onClose}
					color="obsidian"
					variant="light"
					flex={1}
				>
					Cancel
				</Button>
				{isResettable && (
					<Button
						onClick={handleReset}
						color="obsidian"
						variant="light"
						flex={1}
					>
						Reset
					</Button>
				)}
				<Button
					type="submit"
					variant="gradient"
					onClick={handleSave}
					flex={1}
				>
					Save
				</Button>
			</Group>
		</Stack>
	);
}
