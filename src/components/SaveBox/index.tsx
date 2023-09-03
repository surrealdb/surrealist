import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Group } from "@mantine/core";
import { mdiCheck } from "@mdi/js";
import { useLater } from "~/hooks/later";
import { Icon } from "../Icon";
import { klona } from "klona";
import fastDeepEqual from "fast-deep-equal";

export interface SaveBoxProps {
	value: any;
	valid?: boolean;
	onPatch?: () => any;
	onRevert?: (original: any) => void;
	onSave: (original: any) => any;
	onChangedState?: (isChanged: boolean) => void;
}

/**
 * To use this component effectively you should delay
 * the mounting of the save box until after your remote
 * data has been fetched and loaded. The data at the
 * time of mounting will be seen as the "original" state.
 * It is recommended to use the `useSaveBox` hook to
 * streamline the integration of this component.
 *
 * The `value` prop should usually be assigned an object
 * containing all state you want to track. This object
 * will later be passed back by `onRevert` in order to
 * reset each state hook to their original value.
 *
 * When `valid` is false, the save button will be disabled.
 *
 * Use the `onSave` prop to save the current state to
 * the database. The data at the moment of saving will
 * be seen as the new "original" state.
 *
 * Use the `onPatch` prop to make changes to the state
 * before saving.
 */
export const SaveBox = ({ value, valid, onRevert, onPatch, onSave, onChangedState }: SaveBoxProps) => {
	const [isSaving, setIsSaving] = useState(false);
	const [original, setOriginal] = useState(klona(value));

	const isChanged = useMemo(() => !fastDeepEqual(original, value), [original, value]);

	const doCompleteSave = useCallback(() => {
		setOriginal(klona(value));
		setIsSaving(false);
		onSave?.(original);
	}, [onSave, original, value]);

	const doRevert = useCallback(() => {
		onRevert?.(klona(original));
	}, [onRevert, original]);

	const triggerSave = useLater(doCompleteSave);
	const doSave = useCallback(async () => {
		setIsSaving(true);

		await Promise.resolve(onPatch?.());

		triggerSave();
	}, [onPatch, triggerSave]);

	useEffect(() => {
		if (onChangedState) {
			onChangedState(isChanged);
		}
	}, [isChanged, onChangedState]);

	return (
		<Group spacing={10} align="center" position="apart">
			<Button
				rightIcon={<Icon path={mdiCheck} size={1} />}
				loaderPosition="right"
				loading={isSaving}
				disabled={!isChanged || valid === false}
				onClick={doSave}
			>
				Save changes
			</Button>
			{onRevert && (
				<Button disabled={!isChanged || valid === false} onClick={doRevert} color="dark.4">
					Revert
				</Button>
			)}
		</Group>
	);
};
