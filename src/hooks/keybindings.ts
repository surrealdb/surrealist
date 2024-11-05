import { type HotkeyItem, useHotkeys } from "@mantine/hooks";
import { useMemo } from "react";
import { useCommandRegistry } from "~/providers/Commands";
import { useConfigStore } from "~/stores/config";

/**
 * TODO Add remappable keymaps
 */
export function useKeymap(hotkeys: HotkeyItem[]) {
	useHotkeys(hotkeys, [], true);
}

/**
 * Build the final user-customized keybinding map
 *
 * @returns Map of commands to keybindings
 */
export function useKeybindMap() {
	const userKeybinds = useConfigStore((state) => state.keybindings);
	const commands = useCommandRegistry();

	return useMemo(() => {
		const base = new Map<string, string[]>();

		for (const [id, { binding }] of commands.entries()) {
			if (Array.isArray(binding)) {
				base.set(id, binding);
			}
		}

		for (const [id, binding] of Object.entries(userKeybinds)) {
			base.set(id, binding);
		}

		return base;
	}, [commands, userKeybinds]);
}
