import { useCallback, useMemo, useState } from 'react';
import { Button, clsx, Group, Notification, Text } from '@mantine/core';
import { mdiCheck } from '@mdi/js';
import { Spacer } from '../Spacer';
import { useLater } from '~/hooks/later';
import classes from './style.module.scss';
import { Icon } from '../Icon';
import { klona } from 'klona';
import fastDeepEqual from 'fast-deep-equal';

export interface SaveBoxProps {
	value: any;
	valid?: boolean;
	onPatch?: () => any;
	onRevert?: (original: any) => void;
	onSave: (original: any) => any;
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
export const SaveBox = ({ value, valid, onRevert, onPatch, onSave }: SaveBoxProps) => {
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

	return (
		<Notification
			disallowClose
			className={clsx(classes.root, !isChanged && classes.hidden)}
			sx={theme => ({
				backgroundColor: theme.fn.primaryColor(),
				zIndex: 999
			})}
		>
			<Group
				spacing={10}
				align="center"
			>
				<Text color="white" size="md">
					You have unsaved changes.
				</Text>
				<Spacer />
				{onRevert && (
					<Button
						onClick={doRevert}
					>
						Revert
					</Button>
				)}
				<Button
					color="gray.0"
					sx={theme => ({ color: theme.fn.primaryColor() })}
					rightIcon={<Icon path={mdiCheck} size={1} />}
					loaderPosition="right"
					loading={isSaving}
					disabled={valid === undefined ? false : !valid}
					onClick={doSave}
				>
					Apply
				</Button>
			</Group>
		</Notification>
	);
};