import React, { useState } from "react";
import { SaveBox } from "~/components/SaveBox";
import { useStable } from "./stable";

interface SaveBoxOptions<T> {
	when?: boolean;
	track: T;
	valid?: boolean;
	onPatch?: () => void;
	onSave: (original?: T) => void;
	onRevert?: (original: T) => void;
	onChangedState?: (value: boolean) => void;
}

interface SaveBoxResult {
	render: JSX.Element | null;
	skip: () => void;
}

/**
 * Helper hook to facilitate the rendering of a save box. The save box
 * will only start tracking changes after the `when` condition is met.
 *
 * The skip function can be called directly after a mutation to tracked
 * state in order to prevent the save box from revealing.
 *
 * @param options The save box options
 * @returns The save box element
 */
export function useSaveBox<T extends Record<string, any>>(options: SaveBoxOptions<T>): SaveBoxResult {
	const showSaveBox = options.when ?? true;
	const [skipKey, setSkipKey] = useState(0);

	const skip = useStable(() => {
		setSkipKey(k => k + 1);
	});

	const render = showSaveBox ? React.createElement(SaveBox, {
		key: skipKey,
		value: options.track,
		valid: options.valid,
		onRevert: options.onRevert,
		onSave: options.onSave,
		onPatch: options.onPatch,
		onChangedState: options.onChangedState,
	}) : null;

	return {
		render,
		skip,
	};
}
