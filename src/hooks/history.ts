import { useStable } from "./stable";
import isEqual from "fast-deep-equal";

export interface HistoryOptions<T> {
	history: T[];
	index: number;
	setHistory: (items: T[]) => void;
	setIndex: (index: number) => void;
}

export interface HistoryHandle<T> {
	current: T | undefined;
	hasBack: boolean;
	hasForward: boolean;
	goBack: () => void;
	goForward: () => void;
	push: (value: T) => void;
	clear: () => void;
}

export function useHistory<T = string>(options: HistoryOptions<T>): HistoryHandle<T> {
	const { history, index, setIndex, setHistory } = options;

	const current = history[index];
	const hasBack = index > 0;
	const hasForward = index < history.length - 1;

	const goBack = useStable(() => {
		if (hasBack) {
			setIndex(index - 1);
		}
	});

	const goForward = useStable(() => {
		if (hasForward) {
			setIndex(index + 1);
		}
	});

	const push = useStable((value: T) => {
		if (history.length > 0 && isEqual(current, value)) {
			return;
		}

		if (index < history.length - 1) {
			setHistory(history.slice(0, index + 1));
		}

		setHistory([...history, value]);
		setIndex(Math.min(history.length, index + 1));
	});

	const clear = useStable(() => {
		setHistory([]);
		setIndex(0);
	});

	return {
		current,
		hasBack,
		hasForward,
		goBack,
		goForward,
		push,
		clear,
	};
}
