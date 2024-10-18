import { useWindowEvent } from "@mantine/hooks";
import { useRef, useState } from "react";
import type { Identified } from "~/types";
import { useStable } from "./stable";

/**
 * Returns whether any of the keys is currently pressed
 * and updates the state when key is pressed or released.
 *
 * NOTE This function currently isnt working due to the
 * react-flow fix in place inside the Scaffold.
 *
 * @param keys Keys to listen for
 * @returns Whether any of the keys is currently pressed
 */
export function useActiveKeys(...keys: string[]): boolean {
	const [active, setActive] = useState<string[]>([]);

	useWindowEvent("keydown", (e) => {
		if (keys.includes(e.key) && !active.includes(e.key)) {
			setActive((prev) => [...prev, e.key]);
		}
	});

	useWindowEvent("keyup", (e) => {
		if (keys.includes(e.key) && active.includes(e.key)) {
			setActive((prev) => prev.filter((key) => key !== e.key));
		}
	});

	return active.length > 0;
}

function getNavigationElement<T extends Identified>(cmd: T) {
	return document.querySelector(`[data-navigation-item-id="${cmd.id}"]`) as HTMLElement | null;
}

/**
 * Allow keyboard navigation between items in a list.
 * 
 * @param items The items to navigate between
 * @returns onKeyDown handler and a ref to the search input
 */
export function useKeyNavigation<T extends Identified>(items: T[]) {
	const searchRef = useRef<HTMLInputElement | null>(null);

	const handleKeyDown = useStable((e: React.KeyboardEvent) => {
		const isDown = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey);
		const isUp = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey);

		console.log(isDown, isUp);

		if (!isDown && !isUp) {
			if (e.key !== "Shift" && e.key !== "Enter") {
				searchRef.current?.focus();
			}

			return;
		}

		const active = document.activeElement as HTMLElement | null;
		const activeId = active?.getAttribute("data-navigation-item-id");
		const selected = items.find((cmd) => cmd.id === activeId);

		e.preventDefault();

		if (!selected) {
			setTimeout(() => {
				getNavigationElement(items[0])?.focus();
			});
			return;
		}

		if (isDown) {
			const index = items.indexOf(selected);
			const next = items[index + 1] || items[0];

			setTimeout(() => {
				getNavigationElement(next)?.focus();
			});

			return;
		}

		if (isUp) {
			const index = items.indexOf(selected);
			const prev = items[index - 1] || items[items.length - 1];

			setTimeout(() => {
				getNavigationElement(prev)?.focus();
			});

			return;
		}
	});

	return [handleKeyDown, searchRef] as const;
}