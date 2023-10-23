import { useStable } from "./stable";
import isEqual from "fast-deep-equal";

export interface HistoryOptions<T> {
	history: T[];
	setHistory: (items: T[]) => void;
}

export interface HistoryHandle<T> {
	current: T | undefined;
	canPop: boolean;
	pop: () => void;
	push: (value: T) => void;
	clear: () => void;
}

export function useHistory<T = string>(options: HistoryOptions<T>): HistoryHandle<T> {
	const { history, setHistory } = options;

	const current = history.at(-1);
	const canPop = history.length > 1;

	const pop = useStable(() => {
		if (canPop) {
			setHistory(history.slice(0, -1));
		}
	});

	const push = useStable((value: T) => {
		if (history.length > 0 && isEqual(current, value)) {
			return;
		}

		const next = [...history, value];
		
		if (next.length > 30) {
			next.shift();
		}

		setHistory(next);
	});

	const clear = useStable(() => {
		setHistory([]);
	});

	return {
		current,
		canPop,
		pop,
		push,
		clear,
	};
}
