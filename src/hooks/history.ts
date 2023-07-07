import { useState } from "react";
import { useStable } from "./stable";
import isEqual from 'fast-deep-equal';

export interface HistoryHandle<T> {
	history: T[];
	current: T | undefined;
	hasBack: boolean;
	hasForward: boolean;
	goBack: () => void;
	goForward: () => void;
	push: (value: T) => void;
	clear: () => void;
}

export function useHistory<T = string>(): HistoryHandle<T> {
	const [history, setHistory] = useState<T[]>([]);
	const [index, setIndex] = useState(0);

	const current = history[index];
	const hasBack = index > 0;
	const hasForward = index < history.length - 1;

	const goBack = useStable(() => {
		if (hasBack) {
			setIndex(current => current - 1);
		}
	});

	const goForward = useStable(() => {
		if (hasForward) {
			setIndex(current => current + 1);
		}
	});

	const push = useStable((value: T) => {
		if (history.length > 0 && isEqual(current, value)) {
			return;
		}

		if (index < history.length - 1) {
			setHistory(current => current.slice(0, index + 1));
		}

		setHistory(current => [...current, value]);
		setIndex(current => Math.min(history.length, current + 1));
	});

	const clear = useStable(() => {
		setHistory([]);
		setIndex(0);
	});

	return {
		history,
		current,
		hasBack,
		hasForward,
		goBack,
		goForward,
		push,
		clear
	};
}