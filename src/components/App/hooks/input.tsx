import { useEffect } from "react";
import { isModKey } from "~/util/helpers";

/**
 * Track the state of the mod key
 */
export function useModKeyTracker() {
	useEffect(() => {
		const onKeyDown = (e: KeyboardEvent) => {
			if (isModKey(e)) {
				document.body.classList.add("mod");
			}
		};

		const onKeyUp = (e: KeyboardEvent) => {
			if (isModKey(e)) {
				document.body.classList.remove("mod");
			}
		};

		document.body.addEventListener("keydown", onKeyDown);
		document.body.addEventListener("keyup", onKeyUp);

		return () => {
			document.body.removeEventListener("keydown", onKeyDown);
			document.body.removeEventListener("keyup", onKeyUp);
		};
	}, []);
}