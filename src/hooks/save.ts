import fastDeepEqual from "fast-deep-equal";
import { klona } from "klona";
import { useMemo, useState } from "react";
import { useLater } from "./later";
import { useStable } from "./stable";

type Task = unknown | Promise<unknown>;

export interface SaveableOptions<T> {

	/**
	 * The state object to track changes on
	 */
	track: T;

	/**
	 * Whether the state is valid for saving
	 */
	valid?: boolean;

	/**
	 * Called when the current state should be saved
	 * 
	 * @param original The original state
	 */
	onSave: (original: T) => Task;

	/**
	 * Called when the current state should be reverted
	 * 
	 * @param original The original state
	 */
	onRevert: (original: T) => void;

}

export interface SaveableHandle<T> {

	/**
	 * Whether the state is currently considered changed
	 */
	isChanged: boolean;

	/**
	 * Whether the state is currently valid for saving
	 */
	isSaveable: boolean;

	/**
	 * Whether the state is currently being saved
	 */
	isSaving: boolean;
	
	/**
	 * Forcefully schedule the tracked state to be refreshed
	 * after the current render cycle.
	 * 
	 * @param value Optional manual value to refresh to
	 */
	track: () => void;

	/**
	 * Save the current state and invoke the onSave callback.
	 * After onSave is complete, the tracked state will be scheduled
	 * to be refreshed after the current render cycle.
	 */
	save: () => Promise<void>;

	/**
	 * Revert the current state and invoke the onRevert callback.
	 */
	revert: () => void;

}

/**
 * The saveable hook provides facilities for tracking and reverting changes,
 * saving state, and performing validation.
 *
 * @param options The saveable options
 * @returns The saveable handle
 */
export function useSaveable<T extends Record<string, any>>(options: SaveableOptions<T>): SaveableHandle<T> {
	const [isSaving, setIsSaving] = useState(false);
	const [skipTrack, setSkipTrack] = useState(false);
	const [original, setOriginal] = useState(klona(options.track));

	const isEqual = useMemo(() => fastDeepEqual(original, options.track), [original, options.track]);
	const isChanged = !isEqual && !skipTrack;
	const canSave = isChanged && options.valid !== false;

	const trackOriginal = useStable((value?: T) => {
		setOriginal(klona(value ?? options.track));
		setSkipTrack(false);
	});

	const scheduleTrack = useLater(trackOriginal);

	const save = useStable(async () => {
		setIsSaving(true);

		await options.onSave(original);

		setIsSaving(false);
		scheduleTrack();
	});

	const revert = useStable(() => {
		options.onRevert(klona(original));
	});

	const track = useStable(() => {
		setSkipTrack(true);
		scheduleTrack();
	});

	return {
		isSaveable: canSave,
		isChanged,
		isSaving,
		track,
		save,
		revert
	};
}
