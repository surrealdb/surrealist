import { type HotkeyItem, useHotkeys } from "@mantine/hooks";
import { useEffect } from "react";
import { useCommandDispatcher, useCommandKeybinds } from "~/providers/Commands";
import { translateBinding } from "~/providers/Commands/keybindings";
import { isModKey } from "~/util/helpers";

/**
 * Track the state of the mod key
 */
export function useModKeyTracker() {
	useEffect(() => {
		const onKeyDown = (e: Event) => {
			if (isModKey(e)) {
				document.body.classList.add("mod");
			}
		};

		const onKeyUp = (e: Event) => {
			if (isModKey(e)) {
				document.body.classList.remove("mod");
			}
		};

		document.body.addEventListener("blur", onKeyDown);
		document.body.addEventListener("keydown", onKeyDown);
		document.body.addEventListener("keyup", onKeyUp);

		return () => {
			document.body.removeEventListener("blur", onKeyDown);
			document.body.removeEventListener("keydown", onKeyDown);
			document.body.removeEventListener("keyup", onKeyUp);
		};
	}, []);

	const keybinds = useCommandKeybinds();
	const dispatch = useCommandDispatcher();

	const hotkeys = Array.from(
		keybinds.entries().map(([cmd, binding]) => {
			return [translateBinding(binding), () => dispatch(cmd)] as HotkeyItem;
		}),
	);

	useHotkeys(hotkeys, [], true);

	console.log(hotkeys);
}
