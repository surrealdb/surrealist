import { useEffect, useRef, useState } from "react";

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
	}, [interval]);
}

/**
 * Format an elapsed duration in milliseconds into a human-readable string
 * with adaptive precision based on magnitude.
 */
export function formatElapsed(ms: number): string {
	if (ms < 1000) {
		return `${Math.floor(ms)}ms`;
	}

	const seconds = ms / 1000;

	if (seconds < 10) {
		return `${seconds.toFixed(1)}s`;
	}

	if (seconds < 60) {
		return `${Math.floor(seconds)}s`;
	}

	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);

	if (minutes < 60) {
		return `${minutes}m${remainingSeconds.toString().padStart(2, "0")}s`;
	}

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	return `${hours}h${remainingMinutes.toString().padStart(2, "0")}m`;
}

/**
 * Track elapsed time between a start and optional end timestamp.
 * While running (endedAt is null), returns a live-updating formatted
 * duration. Once ended, returns a frozen formatted duration.
 * Returns null only when no query has been started yet.
 *
 * @param startedAt The `performance.now()` timestamp when timing began, or null if never started
 * @param endedAt The `performance.now()` timestamp when timing ended, or null if still running
 */
export function useElapsedTime(startedAt: number | null, endedAt: number | null): string | null {
	const [elapsed, setElapsed] = useState<number | null>(null);
	const frameRef = useRef<number>(0);

	useEffect(() => {
		if (startedAt == null) {
			setElapsed(null);
			return;
		}

		if (endedAt != null) {
			setElapsed(endedAt - startedAt);
			return;
		}

		let lastUpdate = 0;

		const tick = () => {
			const now = performance.now();
			const ms = now - startedAt;

			const interval = ms < 10_000 ? 100 : 1000;

			if (now - lastUpdate >= interval) {
				setElapsed(ms);
				lastUpdate = now;
			}

			frameRef.current = requestAnimationFrame(tick);
		};

		frameRef.current = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(frameRef.current);
	}, [startedAt, endedAt]);

	if (elapsed == null) {
		return null;
	}

	return formatElapsed(elapsed);
}
