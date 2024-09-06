import { type HotkeyItem, useHotkeys } from "@mantine/hooks";

/**
 * TODO Add remappable keymaps
 */
export function useKeymap(hotkeys: HotkeyItem[]) {
	useHotkeys(hotkeys, [], true);
}
