import { useEffect, useState } from "react";

/**
 * Schedule a refresh timer that will trigger a re-render every `interval` milliseconds.
 *
 * @param interval The interval in milliseconds
 */
export function useRefreshTimer(interval: number) {
	const [_, setCounter] = useState(0);

	useEffect(() => {
		const task = setInterval(() => {
			setCounter((prev) => prev + 1);
		}, interval);

		return () => clearInterval(task);
	}, []);
}