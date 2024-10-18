import { useWindowEvent } from "@mantine/hooks";
import { useLayoutEffect, useRef, useState } from "react";
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
 * @param onSubmit Optional callback to call when an item is activated
 * @returns onKeyDown handler and a ref to the search input
 */
export function useKeyNavigation<T extends Identified>(items: T[], onSubmit?: (item: T) => void, initial?: string) {
	const [active, setActive] = useState<string>(initial ?? "");
	
	const handleKeyDown = useStable((e: React.KeyboardEvent) => {
		if (!active) return;

		if (e.key === "Enter") {
			const item = items.find((item) => item.id === active);
			onSubmit?.(item as T);
			return;
		}

		const isDown = e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey);
		const isUp = e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey);

		if (!isDown && !isUp) {
			return;
		}

		e.preventDefault();
		e.stopPropagation();

		let nextItem = "";

		if (isDown) {
			const index = items.findIndex((item) => item.id === active);
			const next = items[index + 1] || items[0];

			nextItem = next.id;
		} else if (isUp) {
			const index = items.findIndex((item) => item.id === active);
			const prev = items[index - 1] || items[items.length - 1];

			nextItem = prev.id;
		}

		setActive(nextItem);

		const selected = document.querySelector<HTMLElement>(`[data-navigation-item-id="${nextItem}"]`) as HTMLElement | null;

		selected?.scrollIntoView({
			block: "nearest"
		});
	});

	useLayoutEffect(() => {
		const found = items.find((item) => item.id === active);

		if (!found && items.length > 0) {
			setActive(items[0].id);
		}
	});

	return [handleKeyDown, active] as const;
}