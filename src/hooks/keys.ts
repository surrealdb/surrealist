import { useWindowEvent } from "@mantine/hooks";
import { useState } from "react";

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
