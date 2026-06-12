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
}

/**
 * Listen for keybinds and dispatch commands
 */
export function useKeybindListener() {
	const keybinds = useCommandKeybinds();
	const dispatch = useCommandDispatcher();

	const hotkeys = Array.from(keybinds.entries()).map(([cmd, binding]) => {
		return [
			translateBinding(binding),
			() => dispatch(cmd),
			{ preventDefault: true },
		] as HotkeyItem;
	});

	useHotkeys(hotkeys, [], true);
}

/**
 * Listen for the escape key and prevent default
 */
export function useEscapeKeyListener() {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.code !== "Escape") {
				return;
			}

			// Let CodeMirror editors handle Escape themselves, such as exiting
			// Vim insert mode or closing autocompletion. Calling preventDefault
			// here runs before the editor and causes CodeMirror to skip its own
			// key handlers for the event.
			if (e.target instanceof Element && e.target.closest(".cm-editor")) {
				return;
			}

			e.preventDefault();
		};

		document.addEventListener("keydown", onKeyDown, true);

		return () => {
			document.removeEventListener("keydown", onKeyDown, true);
		};
	}, []);
}
