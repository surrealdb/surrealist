import equal from "fast-deep-equal";

import {
	ActionIcon,
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
import { Fragment, useMemo, useState } from "react";
import { Icon } from "~/components/Icon";
import { KeybindInput } from "~/components/Inputs/keybinding";
import { PrimaryTitle } from "~/components/PrimaryTitle";
import { Shortcut } from "~/components/Shortcut";
import { Spacer } from "~/components/Spacer";
import { useBoolean } from "~/hooks/boolean";
import { useKeybindMap } from "~/hooks/keybindings";
import { useStable } from "~/hooks/stable";
import { type Command, useCommandCategories } from "~/providers/Commands";
import { useConfigStore } from "~/stores/config";
import { fuzzyMatch } from "~/util/helpers";
import { iconEdit, iconPlus, iconSearch } from "~/util/icons";
import { displayBinding } from "~/providers/Commands/keybindings";

export function KeybindingsTab() {
	const [search, setSearch] = useInputState("");
	const userKeybinds = useConfigStore((state) => state.keybindings);
	const categories = useCommandCategories();
	const keybindMap = useKeybindMap();

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
							c="slate"
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
									const active = keybindMap.get(cmd.id);
									const modified = userKeybinds[cmd.id] !== undefined;

									return (
										<Fragment key={j}>
											<Group h={42}>
												<Icon
													path={cmd.icon}
													size="sm"
												/>
												<Text c="bright">{cmd.name}</Text>
												{modified && <Text c="slate">(Modified)</Text>}
												<Spacer />
												{active && active.length > 0 ? (
													<Shortcut value={active} />
												) : (
													<Text c="slate">&mdash;</Text>
												)}
												<ActionIcon
													ml="xl"
													variant="subtle"
													onClick={() => {
														setRecordCommand(cmd);
														recordingHandle.open();
													}}
												>
													<Icon path={active ? iconEdit : iconPlus} />
												</ActionIcon>
											</Group>
											{j < category.commands.length - 1 && <Divider />}
										</Fragment>
									);
								})}
							</Stack>
						</Box>
					))}
				</Stack>
			</ScrollArea>

			<Modal
				opened={isRecording}
				onClose={recordingHandle.close}
			>
				{recordCommand && (
					<RecordingModal
						command={recordCommand}
						keybindMap={keybindMap}
						onClose={recordingHandle.close}
					/>
				)}
			</Modal>
		</>
	);
}

interface RecordingModalProps {
	command: Command;
	keybindMap: Map<string, string[]>;
	onClose: () => void;
}

function RecordingModal({ command, keybindMap, onClose }: RecordingModalProps) {
	const { setKeybinding, removeKeybinding } = useConfigStore.getState();

	const [binding, setBinding] = useState<string[]>([]);
	const active = keybindMap.get(command.id);
	const hasOldBinding = active && active.length > 0;
	// const hasNewBinding = binding && binding.length > 0;
	const isResettable = active && !equal(active, command.binding);

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
			</Box>
			<Box>
				<KeybindInput
					mt="sm"
					autoFocus
					value={binding}
					onChange={setBinding}
					placeholder="Listening for input..."
				/>
				{hasOldBinding && (
					<Text
						fz="sm"
						ml={2}
						mt="xs"
						c="slate"
					>
						Currently bound to <b>{displayBinding(active)}</b>
					</Text>
				)}
			</Box>
			<Group mt="lg">
				<Button
					onClick={onClose}
					color="slate"
					variant="light"
					flex={1}
				>
					Cancel
				</Button>
				{isResettable && (
					<Button
						onClick={handleReset}
						color="slate"
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
